/*
 * KCL department groups and course names used in the registration form.
 */

export const KCL_DEPARTMENTS = {
    "Arts & Humanities": [
      "English Literature",
      "Film Studies",
      "History",
      "Arabic",
      "Modern Languages",
      "French",
      "Music",
      "Portuguese",
      "German",
      "Italian",
      "Chinese",
      "Philosophy",
      "Classical Studies",
      "Spanish",
    ],
    "Business": [
      "Accounting & Finance",
      "Business Management",
      "Economics",
      "International Management",
    ],
    "Dentistry, Oral & Craniofacial Sciences": [
      "Dentistry",
    ],
    "Law": [
      "Law",
    ],
    "Life Sciences & Medicine": [
      "Biomedical Science",
      "Medicine",
      "Neuroscience",
    ],
    "Natural, Mathematical & Engineering Sciences": [
      "Artificial Intelligence",
      "Chemistry",
      "Computer Science",
      "Computer Science with Management",
      "Electronic Engineering",
      "General Engineering",
      "Mathematics",
      "Physics",
    ],
    "Nursing, Midwifery & Palliative Care": [
      "Midwifery",
      "Nursing",
    ],
    "Psychiatry, Psychology & Neuroscience": [
      "Neuroscience",
      "Psychology",
    ],
    "Social Science & Public Policy": [
      "Economics",
      "Geography",
      "International Relations",
      "Politics",
    ],
}

export const ALL_KCL_COURSES = Object.values(KCL_DEPARTMENTS).flat()
