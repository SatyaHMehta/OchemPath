// Shared course metadata used by the app. Replace video IDs and text with real content.
export const courses = [
  {
    id: 0,
    slug: 'organic-chem-1',
    name: 'Organic Chemistry 1',
    logo: '/Ochem1.JPG',
    cover: '/Ochem1.JPG',
    description:
      'An introductory course covering fundamentals and key organic chemistry concepts.',
    chapters: [
      {
        id: 'ch1',
        title: 'Chapter 1: Review of General Chemistry',
        videos: [
          { id: 'dQw4w9WgXcQ', title: 'Review: Atomic Structure' },
          { id: '9bZkp7q19f0', title: 'Review: Bonding' },
        ],
      },
      {
        id: 'ch2',
        title: 'Chapter 2: Molecular Representations',
        videos: [
          { id: '3JZ_D3ELwOQ', title: 'Lewis Structures' },
          { id: 'Zi_XLOBDo_Y', title: '3D Representations' },
        ],
      },
      {
        id: 'ch3',
        title: 'Chapter 3: Acids and Bases',
        videos: [
          { id: 'V-_O7nl0Ii0', title: 'pH and pKa' },
        ],
      },
    ],
  },
  {
    id: 1,
    slug: 'organic-chem-2',
    name: 'Organic Chemistry 2',
    logo: '/Ochem2.JPG',
    cover: '/Ochem2.JPG',
    description: 'Continuation: reaction mechanisms and synthesis.',
    chapters: [],
  },
];

export function getCourseById(id) {
  return courses.find((c) => c.id === Number(id));
}

export function getAllCourseIds() {
  return courses.map((c) => String(c.id));
}
