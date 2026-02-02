import type { DishDetail } from "../../../lib/dishes";

export type ResultGroup = {
  id: string;
  title: string;
  keywords: string[];
  items: DishDetail[];
  description: string;
};

export type FooterOption = {
  label: string;
  icon: string;
};