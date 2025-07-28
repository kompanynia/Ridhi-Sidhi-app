import { Product } from '@/types';

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'PVC Pipe - Standard',
    description: 'High-quality PVC pipe for plumbing and drainage applications. Durable and long-lasting.',
    price: 250,
    imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=1000',
    company: 'Ajay Pipes',
    category: 'Pipes',
    variations: [
      { id: 'v1', size: '1/2 inch', variety: 'Standard', price: 250, availableLocations: ['Udaipur', 'Mungana'] },
      { id: 'v2', size: '3/4 inch', variety: 'Standard', price: 300, availableLocations: ['Udaipur', 'Mungana'] },
      { id: 'v3', size: '1 inch', variety: 'Standard', price: 350, availableLocations: ['Udaipur', 'Mungana'] },
    ],
    locations: ['Udaipur', 'Mungana']
  },
  {
    id: '2',
    name: 'CPVC Pipe - Hot Water',
    description: 'Chlorinated PVC pipes designed specifically for hot water applications. Temperature resistant.',
    price: 350,
    imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=1000',
    company: 'Ajay Pipes',
    category: 'Pipes',
    variations: [
      { id: 'v1', size: '1/2 inch', variety: 'Standard', price: 350, availableLocations: ['Udaipur'] },
      { id: 'v2', size: '3/4 inch', variety: 'Standard', price: 425, availableLocations: ['Udaipur'] },
      { id: 'v3', size: '1 inch', variety: 'Standard', price: 500, availableLocations: ['Udaipur'] },
    ],
    locations: ['Udaipur']
  },
  {
    id: '3',
    name: 'PVC Elbow Joint',
    description: 'PVC elbow joint for connecting pipes at 90-degree angles. Easy to install.',
    price: 45,
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1000',
    company: 'Ajay Pipes',
    category: 'Fittings',
    variations: [
      { id: 'v1', size: '1/2 inch', variety: 'Standard', price: 45, availableLocations: ['Udaipur', 'Mungana'] },
      { id: 'v2', size: '3/4 inch', variety: 'Standard', price: 60, availableLocations: ['Udaipur', 'Mungana'] },
      { id: 'v3', size: '1 inch', variety: 'Standard', price: 75, availableLocations: ['Udaipur', 'Mungana'] },
    ],
    locations: ['Udaipur', 'Mungana']
  },
  {
    id: '4',
    name: 'PVC T-Joint',
    description: 'T-shaped PVC joint for creating three-way connections in your plumbing system.',
    price: 55,
    imageUrl: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?q=80&w=1000',
    company: 'Ajay Pipes',
    category: 'Fittings',
    variations: [
      { id: 'v1', size: '1/2 inch', variety: 'Standard', price: 55, availableLocations: ['Mungana'] },
      { id: 'v2', size: '3/4 inch', variety: 'Standard', price: 75, availableLocations: ['Mungana'] },
      { id: 'v3', size: '1 inch', variety: 'Standard', price: 90, availableLocations: ['Mungana'] },
    ],
    locations: ['Mungana']
  },
  {
    id: '5',
    name: 'UPVC Window Frame',
    description: 'Unplasticized PVC window frame. Weather-resistant and low maintenance.',
    price: 1200,
    imageUrl: 'https://images.unsplash.com/photo-1604082787741-d1f78ce8e4a0?q=80&w=1000',
    company: 'XYZ Co.',
    category: 'Windows',
    variations: [
      { id: 'v1', size: 'Small', variety: '3x2 ft', price: 1200, availableLocations: ['Udaipur'] },
      { id: 'v2', size: 'Medium', variety: '4x3 ft', price: 1500, availableLocations: ['Udaipur'] },
      { id: 'v3', size: 'Large', variety: '5x4 ft', price: 1800, availableLocations: ['Udaipur'] },
    ],
    locations: ['Udaipur']
  },
  {
    id: '6',
    name: 'UPVC Door Frame',
    description: 'Durable UPVC door frame with excellent insulation properties. Easy to maintain.',
    price: 2500,
    imageUrl: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?q=80&w=1000',
    company: 'XYZ Co.',
    category: 'Doors',
    variations: [
      { id: 'v1', size: 'Standard', variety: '80x32 inch', price: 2500, availableLocations: ['Udaipur', 'Mungana'] },
      { id: 'v2', size: 'Wide', variety: '84x36 inch', price: 3000, availableLocations: ['Udaipur', 'Mungana'] },
      { id: 'v3', size: 'Double', variety: '72x80 inch', price: 3500, availableLocations: ['Udaipur', 'Mungana'] },
    ],
    locations: ['Udaipur', 'Mungana']
  },
  {
    id: '7',
    name: 'PVC Water Tank',
    description: 'Food-grade PVC water storage tank. UV-resistant and durable.',
    price: 3500,
    imageUrl: 'https://images.unsplash.com/photo-1571907483083-af70aeda3086?q=80&w=1000',
    company: 'ABC Plastics',
    category: 'Storage',
    variations: [
      { id: 'v1', size: '500L', variety: 'Standard', price: 3500, availableLocations: ['Mungana'] },
      { id: 'v2', size: '1000L', variety: 'Standard', price: 5000, availableLocations: ['Mungana'] },
      { id: 'v3', size: '2000L', variety: 'Standard', price: 6500, availableLocations: ['Mungana'] },
    ],
    locations: ['Mungana']
  },
  {
    id: '8',
    name: 'PVC Pipe Cutter',
    description: 'Professional-grade PVC pipe cutter. Makes clean cuts with minimal effort.',
    price: 450,
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=1000',
    company: 'Tool Masters',
    category: 'Tools',
    variations: [
      { id: 'v1', size: 'Standard', variety: 'Basic', price: 450, availableLocations: ['Udaipur', 'Mungana'] },
      { id: 'v2', size: 'Professional', variety: 'Advanced', price: 650, availableLocations: ['Udaipur', 'Mungana'] },
    ],
    locations: ['Udaipur', 'Mungana']
  }
];

export const getCompanies = () => {
  const companies = new Set(mockProducts.map(product => product.company));
  return Array.from(companies);
};

export const getCategories = () => {
  const categories = new Set(mockProducts.map(product => product.category));
  return Array.from(categories);
};