const fs = require('fs');
const faqs = JSON.parse(fs.readFileSync('/home/venkitesh/Out Projects/Forensic Talents/parsed_faqs.json', 'utf8'));

const serviceMap = {
  'pcc': {
    title: 'Police Clearance Certificate',
    file: 'Police Clearance Certificate.docx',
    catchyIntro: "Seamlessly navigate background checks with our globally accepted, error-free Police Clearance and Fingerprinting services.",
    faqs: faqs['Police Clearance Certificate.docx'] || []
  },
  'questioned-documents': {
    title: 'Questioned Documents Examination',
    file: 'Questioned Document Examination.docx',
    catchyIntro: "Uncover the truth behind disputed documents through rigorous scientific examination of handwriting, forgery, and authenticity.",
    faqs: faqs['Questioned Document Examination.docx'] || []
  },
  'fingerprint': {
    title: 'Fingerprint Investigation',
    file: 'Fingerprint examination.docx',
    catchyIntro: "Precision fingerprint analysis utilizing world-class methods for flawless identity verification and criminal investigation.",
    faqs: faqs['Fingerprint examination.docx'] || []
  },
  'cyber': {
    title: 'Cyber Forensics & Digital Investigation',
    file: 'Cyber Forensics.docx',
    catchyIntro: "Advanced digital investigation recovering critical evidence from devices and networks to combat modern cyber threats.",
    faqs: faqs['Cyber Forensics.docx'] || []
  },
  'crime-scene': {
    title: 'Crime Scene Investigation',
    file: 'Crime Scene Investigation.docx',
    catchyIntro: "Expert evidence collection, preservation, and precise scene reconstruction to capture the full story behind the crime.",
    faqs: faqs['Crime Scene Investigation.docx'] || []
  },
  'cross-examination': {
    title: 'Forensic Cross Examination',
    file: 'Forensic Cross Examination.docx',
    catchyIntro: "Strategic evaluation and questioning of forensic evidence to ensure scientific validity and legally reliable courtroom outcomes.",
    faqs: faqs['Forensic Cross Examination.docx'] || []
  },
  'polygraph': {
    title: 'Polygraph Examination',
    file: 'Polygraph Examination.docx',
    catchyIntro: "Accurately assess truthfulness with advanced physiological monitoring and expert polygraph analysis for critical investigations.",
    faqs: faqs['Polygraph Examination.docx'] || []
  },
};

const fileContent = `export const serviceDetails = ${JSON.stringify(serviceMap, null, 2)};\n`;
fs.writeFileSync('/home/venkitesh/Out Projects/Forensic Talents/Project Forensic/frontend/src/data/serviceDetails.js', fileContent);
console.log("Done generating serviceDetails.js");
