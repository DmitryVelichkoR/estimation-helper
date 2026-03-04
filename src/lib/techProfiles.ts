export interface TechProfileDefaults {
  qaRatio?: number;
  checklistLabels?: string[];
  cmsComplexity?: number;
  hostingCiComplexity?: number;
  themeTemplateComplexity?: number;
}

export interface TechProfile {
  key: string;
  name: string;
  description: string;
  /** Multiplier for base dev hours. adjustedDevHours = baseDevHours * devMultiplier */
  devMultiplier: number;
  defaults: TechProfileDefaults;
}

export const techProfiles: TechProfile[] = [
  {
    key: "jamstack",
    name: "Jamstack",
    description: "Static sites, headless CMS, CDN",
    devMultiplier: 1.0,
    defaults: {
      qaRatio: 0.25,
      checklistLabels: ["Dev", "QA", "Deploy"],
      cmsComplexity: 0.3,
      hostingCiComplexity: 0.2,
      themeTemplateComplexity: 0.4,
    },
  },
  {
    key: "nextjs",
    name: "Next.js",
    description: "React framework, SSR, Vercel",
    devMultiplier: 1.1,
    defaults: {
      qaRatio: 0.25,
      checklistLabels: ["Dev", "QA", "Deploy"],
      cmsComplexity: 0.3,
      hostingCiComplexity: 0.2,
      themeTemplateComplexity: 0.4,
    },
  },
  {
    key: "jamstack-nextjs",
    name: "Jamstack / Next.js",
    description: "Static/SSR with Next.js, Vercel, headless CMS",
    devMultiplier: 1.1,
    defaults: {
      qaRatio: 0.25,
      checklistLabels: ["Dev", "QA", "Deploy"],
      cmsComplexity: 0.3,
      hostingCiComplexity: 0.2,
      themeTemplateComplexity: 0.4,
    },
  },
  {
    key: "webflow",
    name: "Webflow",
    description: "Visual CMS, hosted, design-first",
    devMultiplier: 0.7,
    defaults: {
      qaRatio: 0.2,
      checklistLabels: ["Design", "Content", "QA"],
      cmsComplexity: 0.2,
      hostingCiComplexity: 0.1,
      themeTemplateComplexity: 0.7,
    },
  },
  {
    key: "wordpress",
    name: "WordPress",
    description: "PHP CMS, themes, plugins",
    devMultiplier: 1.2,
    defaults: {
      qaRatio: 0.3,
      checklistLabels: ["Dev", "QA", "Content"],
      cmsComplexity: 0.6,
      hostingCiComplexity: 0.4,
      themeTemplateComplexity: 0.6,
    },
  },
  {
    key: "gatsby",
    name: "Gatsby",
    description: "React static site generator",
    devMultiplier: 1.0,
    defaults: {
      qaRatio: 0.25,
      checklistLabels: ["Dev", "QA", "Build"],
      cmsComplexity: 0.4,
      hostingCiComplexity: 0.3,
      themeTemplateComplexity: 0.5,
    },
  },
  {
    key: "shopify",
    name: "Shopify",
    description: "E‑commerce platform, Liquid themes",
    devMultiplier: 1.0,
    defaults: {
      qaRatio: 0.3,
      checklistLabels: ["Dev", "QA", "Checkout"],
      cmsComplexity: 0.5,
      hostingCiComplexity: 0.1,
      themeTemplateComplexity: 0.7,
    },
  },
  {
    key: "custom",
    name: "Custom",
    description: "Custom stack, set your own defaults",
    devMultiplier: 1.0,
    defaults: {
      qaRatio: 0.25,
      checklistLabels: ["Dev", "QA"],
      cmsComplexity: 0.5,
      hostingCiComplexity: 0.5,
      themeTemplateComplexity: 0.5,
    },
  },
];

export function getTechProfile(key: string): TechProfile | undefined {
  return techProfiles.find((p) => p.key === key);
}

export function buildTechConfig(
  profile: TechProfile,
  overrides: {
    cmsComplexity?: number;
    hostingCiComplexity?: number;
    themeTemplateComplexity?: number;
  }
): TechProfileDefaults {
  return {
    qaRatio: profile.defaults.qaRatio,
    checklistLabels: profile.defaults.checklistLabels,
    cmsComplexity: overrides.cmsComplexity ?? profile.defaults.cmsComplexity ?? 0.5,
    hostingCiComplexity: overrides.hostingCiComplexity ?? profile.defaults.hostingCiComplexity ?? 0.5,
    themeTemplateComplexity: overrides.themeTemplateComplexity ?? profile.defaults.themeTemplateComplexity ?? 0.5,
  };
}
