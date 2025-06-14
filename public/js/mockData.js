const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createMockData() {
  const uid = "gYZKRTK935MmGXRm6pwtdOdhXHW2";
  const clinicId = "jtdlnGBEWY9XIpG27G47";

  const histories = [
    {
      specialistName: "Dr. Evelyn Carter",
      specialistType: "Gastrology",
      diagnosisSummary: "Gastritis",
      notes: "Avoid spicy food and alcohol.",
      treatment: "Antacids and dietary changes",
      medicineName: "Omeprazole",
      testName: "Endoscopy",
      imageType: "Stomach X-ray"
    },
    {
      specialistName: "Dr. Evelyn Carter",
      specialistType: "Gastrology",
      diagnosisSummary: "Acid Reflux",
      notes: "Elevate head during sleep.",
      treatment: "PPI medication",
      medicineName: "Lansoprazole",
      testName: "PH Monitoring",
      imageType: "Esophagus Scan"
    },
    {
      specialistName: "Dr. Evelyn Carter",
      specialistType: "Gastrology",
      diagnosisSummary: "Irritable Bowel Syndrome (IBS)",
      notes: "Follow low FODMAP diet.",
      treatment: "Dietary management and probiotics",
      medicineName: "Probiotic Capsule",
      testName: "Stool Test",
      imageType: "Colon Ultrasound"
    },
    {
      specialistName: "Dr. Evelyn Carter",
      specialistType: "Gastrology",
      diagnosisSummary: "Peptic Ulcer",
      notes: "Avoid NSAIDs and caffeine.",
      treatment: "H. pylori eradication",
      medicineName: "Amoxicillin + Clarithromycin",
      testName: "Urea Breath Test",
      imageType: "Ulcer Endoscopy"
    },
    {
      specialistName: "Dr. Evelyn Carter",
      specialistType: "Gastrology",
      diagnosisSummary: "Constipation",
      notes: "Increase fiber intake.",
      treatment: "Laxatives and hydration",
      medicineName: "Lactulose",
      testName: "Colonoscopy",
      imageType: "Abdominal CT"
    }
  ];

  for (let i = 0; i < histories.length; i++) {
    const visitDate = `2024-03-0${i + 1}`;
    const testDate = `2024-03-1${i + 1}`;
    const prescriptionDate = `2024-03-2${i + 1}`;
    const h = histories[i];

    const historyRef = await db.collection("medicalHistory").add({
      patientId: uid,
      clinicId,
      visitDate,
      specialistName: h.specialistName,
      specialistType: h.specialistType,
      diagnosisSummary: h.diagnosisSummary,
      consultationNotes: h.notes,
      treatmentPlan: h.treatment,
      followUpInstructions: "Return in 2 weeks",
      attachments: []
    });
    await historyRef.update({ historyId: historyRef.id });

    const labRef = await db.collection("labTests").add({
      patientId: uid,
      clinicId,
      historyId: historyRef.id,
      testName: h.testName,
      testDate,
      parameters: [
        {
          name: "Sample Param",
          result: "7.2",
          unit: "units",
          referenceRange: "5 - 10"
        }
      ]
    });
    await labRef.update({ testId: labRef.id });

    const radioRef = await db.collection("radiologyTests").add({
      patientId: uid,
      clinicId,
      historyId: historyRef.id,
      type: h.imageType,
      imageUrl: [`https://example.com/gastro-image${i + 1}.jpg`],
      report: "No significant findings",
      testDate
    });
    await radioRef.update({ testId: radioRef.id });

    const medRef = await db.collection("medications").add({
      patientId: uid,
      historyId: historyRef.id,
      clinicId,
      datePrescribed: prescriptionDate,
      medicineName: h.medicineName,
      dosage: "1 tablet",
      frequency: "Twice daily",
      duration: "14 days"
    });
    await medRef.update({ medicationId: medRef.id });

    console.log(`Gastro record ${i + 1} inserted successfully`);
  }
}




createMockData();
