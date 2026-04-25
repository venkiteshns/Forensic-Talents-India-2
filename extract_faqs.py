import sys, zipfile, xml.dom.minidom, json, os

def extract_docx_text(path):
    document = zipfile.ZipFile(path)
    xml_content = document.read("word/document.xml")
    document.close()
    tree = xml.dom.minidom.parseString(xml_content)
    paragraphs = []
    for paragraph in tree.getElementsByTagName("w:p"):
        texts = [node.nodeValue for node in paragraph.getElementsByTagName("w:t") if node.nodeValue]
        if texts:
            paragraphs.append("".join(texts))
    return paragraphs

files = [
    "Crime Scene Investigation.docx",
    "Cyber Forensics.docx",
    "Fingerprint examination.docx",
    "Forensic Cross Examination.docx",
    "Police Clearance Certificate.docx",
    "Polygraph Examination.docx",
    "Questioned Document Examination.docx"
]

faqs_data = {}

for f in files:
    path = f"../../Documents/{f}"
    if not os.path.exists(path):
        print(f"File not found: {path}")
        continue
    
    lines = extract_docx_text(path)
    # Extract FAQs
    # Usually FAQs are at the end, under "FAQ", "Frequently Asked Questions", etc.
    in_faq = False
    faqs = []
    current_q = None
    current_a = []
    
    for line in lines:
        upper_line = line.strip().upper()
        if "FAQ" in upper_line or "FREQUENTLY ASKED QUESTIONS" in upper_line:
            in_faq = True
            continue
        
        if in_faq:
            line_str = line.strip()
            if not line_str:
                continue
            # Some questions start with "Q:" or end with "?" or start with "Q."
            if line_str.startswith("Q:") or line_str.startswith("Q.") or line_str.startswith("Question:") or "?" in line_str and len(line_str) < 200:
                # Save previous Q&A
                if current_q:
                    faqs.append({"question": current_q, "answer": " ".join(current_a).strip()})
                current_q = line_str
                # remove "Q:" prefix if present
                if current_q.startswith("Q:"): current_q = current_q[2:].strip()
                elif current_q.startswith("Q."): current_q = current_q[2:].strip()
                current_a = []
            else:
                if current_q:
                    # remove "A:" prefix if present
                    if line_str.startswith("A:"): line_str = line_str[2:].strip()
                    elif line_str.startswith("A."): line_str = line_str[2:].strip()
                    current_a.append(line_str)
                    
    if current_q:
        faqs.append({"question": current_q, "answer": " ".join(current_a).strip()})
        
    faqs_data[f] = faqs

with open("extracted_faqs.json", "w") as out:
    json.dump(faqs_data, out, indent=2)

print("Extracted FAQs.")
