
type ResourceCategory = 'Crisis' | 'Coping' | 'Therapy';

interface Resource {
  title: string;
  description: string;
  url: string;
  category: ResourceCategory;
}

interface AllResources {
  crisis: Resource[];
  coping: Resource[];
  therapy: Resource[];
}

export const allResources: AllResources = {
  crisis: [
    {
      title: 'Crisis Text Line',
      description: 'Connect with a crisis counselor for free, 24/7 support. Text HOME to 741741.',
      url: 'https://www.crisistextline.org/',
      category: 'Crisis',
    },
    {
      title: '988 Suicide & Crisis Lifeline',
      description: 'Free and confidential support for people in distress, prevention and crisis resources for you or your loved ones.',
      url: 'https://988lifeline.org/',
      category: 'Crisis',
    },
  ],
  coping: [
    {
      title: 'Headspace: Meditation & Sleep',
      description: 'Learn to meditate and live mindfully. Guided meditations, sleep sounds, and more.',
      url: 'https://www.headspace.com/',
      category: 'Coping',
    },
    {
      title: 'Calm App',
      description: 'Improve your health and happiness with our app for sleep, meditation and relaxation.',
      url: 'https://www.calm.com/',
      category: 'Coping',
    },
     {
      title: 'Moodfit App',
      description: 'A mental health app that provides a set of customizable tools to help you manage stress and anxiety.',
      url: 'https://www.getmoodfit.com/',
      category: 'Coping',
    },
  ],
  therapy: [
    {
      title: 'Psychology Today Therapist Finder',
      description: 'Find detailed professional listings for therapists, psychologists, and counselors in your area.',
      url: 'https://www.psychologytoday.com/us/therapists',
      category: 'Therapy',
    },
    {
      title: 'National Alliance on Mental Illness (NAMI)',
      description: 'NAMI provides advocacy, education, support and public awareness so that all individuals and families affected by mental illness can build better lives.',
      url: 'https://www.nami.org/',
      category: 'Therapy',
    },
  ],
};
