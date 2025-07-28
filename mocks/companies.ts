export interface CompanyDetails {
  name: string;
  address: string;
  phone: string;
  email: string;
  gst: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    branch: string;
  };
  imageUrl: string;
}

export const companiesData: CompanyDetails[] = [
  {
    name: 'Ajay Pipes',
    address: 'Industrial Area, Sector 5, Udaipur, Rajasthan 313001',
    phone: '+91 9876543210',
    email: 'info@ajaypipes.com',
    gst: '08ABCDE1234F1Z5',
    bankDetails: {
      accountName: 'Ajay Pipes Pvt Ltd',
      accountNumber: '1234567890123456',
      bankName: 'State Bank of India',
      ifscCode: 'SBIN0001234',
      branch: 'Udaipur Main Branch'
    },
    imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=1000'
  },
  {
    name: 'XYZ Co.',
    address: 'Plot No. 15, Industrial Estate, Mungana, Rajasthan 312605',
    phone: '+91 9876543211',
    email: 'contact@xyzco.com',
    gst: '08FGHIJ5678K2L6',
    bankDetails: {
      accountName: 'XYZ Company Limited',
      accountNumber: '6543210987654321',
      bankName: 'HDFC Bank',
      ifscCode: 'HDFC0001234',
      branch: 'Mungana Branch'
    },
    imageUrl: 'https://images.unsplash.com/photo-1604082787741-d1f78ce8e4a0?q=80&w=1000'
  },
  {
    name: 'ABC Plastics',
    address: 'Plastic Industrial Zone, Udaipur, Rajasthan 313002',
    phone: '+91 9876543212',
    email: 'sales@abcplastics.com',
    gst: '08MNOPQ9012R3S7',
    bankDetails: {
      accountName: 'ABC Plastics Industries',
      accountNumber: '9876543210123456',
      bankName: 'ICICI Bank',
      ifscCode: 'ICIC0001234',
      branch: 'Udaipur Industrial Branch'
    },
    imageUrl: 'https://images.unsplash.com/photo-1571907483083-af70aeda3086?q=80&w=1000'
  },
  {
    name: 'Tool Masters',
    address: 'Hardware Market, Main Road, Mungana, Rajasthan 312605',
    phone: '+91 9876543213',
    email: 'info@toolmasters.com',
    gst: '08TUVWX3456Y4Z8',
    bankDetails: {
      accountName: 'Tool Masters Pvt Ltd',
      accountNumber: '1357924680135792',
      bankName: 'Punjab National Bank',
      ifscCode: 'PUNB0001234',
      branch: 'Mungana Main Branch'
    },
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=1000'
  }
];

export const getCompanyDetails = (companyName: string): CompanyDetails | null => {
  return companiesData.find(company => company.name === companyName) || null;
};