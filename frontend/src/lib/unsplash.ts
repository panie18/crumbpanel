const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || 'demo';
const UNSPLASH_BASE_URL = 'https://api.unsplash.com';

export interface UnsplashImage {
  id: string;
  urls: {
    small: string;
    regular: string;
    thumb: string;
  };
  user: {
    name: string;
  };
  description: string;
}

export async function searchUnsplashImages(query: string, perPage = 12): Promise<UnsplashImage[]> {
  try {
    if (UNSPLASH_ACCESS_KEY === 'demo') {
      console.log('Using demo images - add UNSPLASH_ACCESS_KEY for real API');
      return getDemoImages();
    }

    const response = await fetch(
      `${UNSPLASH_BASE_URL}/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=squarish&client_id=${UNSPLASH_ACCESS_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching from Unsplash:', error);
    return getDemoImages();
  }
}

function getDemoImages(): UnsplashImage[] {
  return [
    {
      id: '1',
      urls: {
        small: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=200&h=200&fit=crop&crop=face',
        regular: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=400&h=400&fit=crop&crop=face',
        thumb: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face'
      },
      user: { name: 'Professional' },
      description: 'Professional portrait'
    },
    {
      id: '2',
      urls: {
        small: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
        regular: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
        thumb: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
      },
      user: { name: 'Business' },
      description: 'Business portrait'
    },
    {
      id: '3',
      urls: {
        small: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
        regular: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
        thumb: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
      },
      user: { name: 'Casual' },
      description: 'Casual portrait'
    }
  ];
}
