export type PricingPlan = {
  id: string;
  name: string;
  price_label: string;
  best_for: string;
  access_description: string;
  sort_order: number;
  is_active: boolean;
  is_highlighted: boolean;
  created_at: string;
  updated_at: string;
};

export type PricingPlanInput = {
  name: string;
  price_label: string;
  best_for: string;
  access_description: string;
  sort_order?: number;
  is_active?: boolean;
  is_highlighted?: boolean;
};
