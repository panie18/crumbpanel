import { useState, useEffect } from 'react';
import { Search, Download, Check } from 'lucide-react';
import { searchUnsplashImages, type UnsplashImage } from '@/lib/unsplash';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface UnsplashPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (imageUrl: string) => void;
}

export default function UnsplashPicker({ open, onOpenChange, onSelect }: UnsplashPickerProps) {
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [searchTerm, setSearchTerm] = useState('portrait');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const searchImages = async (query: string) => {
    setLoading(true);
    try {
      const results = await searchUnsplashImages(query);
      setImages(results);
    } catch (error) {
      console.error('Error searching images:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      searchImages(searchTerm);
    }
  }, [open]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchImages(searchTerm);
  };

  const handleSelectImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleConfirm = () => {
    if (selectedImage) {
      onSelect(selectedImage);
      onOpenChange(false);
      setSelectedImage(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Choose Profile Picture</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for images... (portrait, professional, avatar)"
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading}>
              Search
            </Button>
          </form>

          {/* Image Grid */}
          <div className="overflow-y-auto max-h-96">
            {loading ? (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                      selectedImage === image.urls.regular 
                        ? 'border-primary shadow-lg scale-105' 
                        : 'border-transparent hover:border-primary/50'
                    }`}
                    onClick={() => handleSelectImage(image.urls.regular)}
                  >
                    <img
                      src={image.urls.thumb}
                      alt={image.description || 'Profile picture option'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {selectedImage === image.urls.regular && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="w-6 h-6 text-primary bg-white rounded-full p-1" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-white text-xs truncate">
                        by {image.user.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Images from Unsplash
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirm} 
                disabled={!selectedImage}
              >
                <Download className="w-4 h-4 mr-2" />
                Use Selected
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
