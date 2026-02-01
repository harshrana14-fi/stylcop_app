
export enum Category {
  TOP = 'top',
  BOTTOM = 'bottom',
  SHOES = 'shoes',
  ACCESSORIES = 'accessories'
}

export enum Style {
  STREETWEAR = 'streetwear',
  CASUAL = 'casual',
  FORMAL = 'formal',
  ETHNIC = 'ethnic',
  CYBERPUNK = 'cyberpunk',
  ATHLEISURE = 'athleisure'
}

export interface ClothingItem {
  id: string;
  image: string;
  category: Category;
  style: Style;
  colorPalette: string[];
  lastWorn?: Date;
}

export interface User {
  name: string;
  college: string;
  points: number;
  streak: number;
  style: string;
}

export interface Recommendation {
  id: string;
  items: ClothingItem[];
  score: number;
  occasion: string;
  reasoning: string;
}

export interface Battle {
  id: string;
  challenger: {
    user: string;
    image: string;
    style: Style;
  };
  defender: {
    user: string;
    image: string;
    style: Style;
  };
  votes: { challenger: number; defender: number };
}
