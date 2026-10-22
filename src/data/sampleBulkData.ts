export const SAMPLE_BULK_DATASETS = [
  {
    id: 'school-students',
    name: 'School / College Students (50 Records)',
    cardTypeId: 'student-id',
    templateId: 'modern-academic',
    csv: `FullName,StudentID,Class,Section,Department,BloodGroup,DOB,Phone,Email,Institution
Aarav Sharma,STU-2026-101,Grade 10,A,Science,O+,2008-04-12,+1-555-1011,aarav.s@stanford.edu,Stanford Academy
Bilal Tariq,STU-2026-102,Grade 10,B,Science,A+,2008-07-23,+1-555-1012,bilal.t@stanford.edu,Stanford Academy
Chloe Dubois,STU-2026-103,Grade 11,A,Arts & Design,B+,2007-02-18,+1-555-1013,chloe.d@stanford.edu,Stanford Academy
David Miller,STU-2026-104,Grade 11,A,Commerce,AB+,2007-09-05,+1-555-1014,david.m@stanford.edu,Stanford Academy
Emma Watson,STU-2026-105,Grade 12,C,Computer Science,O-,2006-11-30,+1-555-1015,emma.w@stanford.edu,Stanford Academy
Farhan Ali,STU-2026-106,Grade 12,B,Pre-Engineering,A-,2006-03-14,+1-555-1016,farhan.a@stanford.edu,Stanford Academy
Grace Hopper,STU-2026-107,Grade 12,A,Computer Science,O+,2006-08-20,+1-555-1017,grace.h@stanford.edu,Stanford Academy
Hassan Raza,STU-2026-108,Grade 10,A,Pre-Medical,B+,2008-12-01,+1-555-1018,hassan.r@stanford.edu,Stanford Academy
Isabella Rossi,STU-2026-109,Grade 11,C,Social Sciences,A+,2007-06-17,+1-555-1019,isabella.r@stanford.edu,Stanford Academy
Javier Gomez,STU-2026-110,Grade 11,B,Science,AB-,2007-10-25,+1-555-1020,javier.g@stanford.edu,Stanford Academy`
  },
  {
    id: 'corp-employees',
    name: 'Tech Company Employees (Corporate)',
    cardTypeId: 'employee-id',
    templateId: 'corporate-clean',
    csv: `FullName,EmployeeID,JobTitle,Department,Email,Phone,BloodGroup,Company
Liam Vance,EMP-8801,Principal Systems Architect,Cloud Infrastructure,liam@nexus.io,+1-555-8801,O+,Nexus Global Tech
Maya Lin,EMP-8802,Senior Product Designer,Design Systems,maya@nexus.io,+1-555-8802,A+,Nexus Global Tech
Nathan Drake,EMP-8803,DevOps Lead,Platform Reliability,nathan@nexus.io,+1-555-8803,B+,Nexus Global Tech
Olivia Wilde,EMP-8804,Director of Engineering,AI Applications,olivia@nexus.io,+1-555-8804,AB+,Nexus Global Tech
Peter Parker,EMP-8805,Security Engineer,Cyber Defense,peter@nexus.io,+1-555-8805,O-,Nexus Global Tech`
  },
  {
    id: 'summit-badges',
    name: 'Conference VIP Badges',
    cardTypeId: 'event-pass',
    templateId: 'vertical-badge',
    csv: `FullName,TicketID,AccessTier,Affiliation,Zone,EventName
Dr. Marie Curie,GTS-2026-001,KEYNOTE SPEAKER,Institute of Radium,Main Auditorium,Global Tech Summit 2026
Nikola Tesla,GTS-2026-002,VIP ALL ACCESS,Tesla Energy Labs,Green Room & VIP Lounge,Global Tech Summit 2026
Ada Lovelace,GTS-2026-003,PANEL SPEAKER,Analytical Computing,Stage B,Global Tech Summit 2026
Claude Shannon,GTS-2026-004,DELEGATE,Information Theory Lab,General Access,Global Tech Summit 2026`
  }
];
