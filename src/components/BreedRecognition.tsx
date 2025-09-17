import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Camera, Loader2, CheckCircle, AlertCircle, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import heroImage from '@/assets/img_bg.jpg';

interface PredictionResult {
  breed: string;
  confidence: string;
}

const BreedRecognition = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null); // New error state
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const API_URL = 'http://127.0.0.1:5000/predict';

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setPrediction(null);
    setError(null); // Reset error when a new file is selected
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const predictBreed = async () => {
    if (!selectedFile) {
      toast({
        title: "No image selected",
        description: "Please select an image first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null); // Reset error before new prediction
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error || !data.breed) {
        throw new Error(data.error || 'Breed could not be identified');
      }

      setPrediction({
        breed: data.breed,
        confidence: data.confidence
      });

      toast({
        title: "Prediction completed!",
        description: `Identified as ${data.breed}`,
      });

    } catch (error: any) {
      console.error('Prediction Error:', error);
      setError(error.message || 'An unexpected error occurred'); // Set error state
      toast({
        title: "Prediction failed",
        description: "Enter a valid image and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-4">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="relative overflow-hidden rounded-2xl shadow-strong">
          <img 
            src={heroImage} 
            alt="Indian cattle and buffalo in pastoral landscape"
            className="w-full h-64 md:h-80 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40 dark:from-black/70 dark:to-black/50 flex items-center justify-center">
            <div className="text-center text-white px-6">
              
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Cattle & Buffalo Breed Recognition
              </h1>
              <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
                Identify Indian indigenous cattle and buffalo breeds with precision AI technology
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <Card className="shadow-medium">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Camera className="h-6 w-6" />
              Upload Image
            </CardTitle>
            <CardDescription className="text-base">
              Upload a clear image of your cattle or buffalo for accurate breed identification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className={`upload-area ${isDragOver ? 'dragover' : ''} relative`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="image-upload"
              />
              <div className="flex flex-col items-center space-y-4">
                <Upload className={`h-12 w-12 ${isDragOver ? 'text-primary' : 'text-muted-foreground'} transition-smooth`} />
                <div className="text-center">
                  <p className="text-lg font-medium">
                    {isDragOver ? 'Drop your image here' : 'Drag & drop your image'}
                  </p>
                  <p className="text-muted-foreground">or click to browse files</p>
                </div>
                <Button variant="barn" size="lg" asChild>
                  <label htmlFor="image-upload" className="cursor-pointer">
                    Select Image
                  </label>
                </Button>
              </div>
            </div>

            {imagePreview && (
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-lg border shadow-soft">
                  <img
                    src={imagePreview}
                    alt="Upload preview"
                    className="w-full max-h-64 object-contain bg-muted/20"
                  />
                </div>
                <Button 
                  onClick={predictBreed} 
                  disabled={isLoading}
                  variant="cattle"
                  size="lg"
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Camera className="h-5 w-5" />
                      Identify Breed
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card className="shadow-medium">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <CheckCircle className="h-6 w-6" />
              Results
            </CardTitle>
            <CardDescription className="text-base">
              AI prediction results with confidence score
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="spinner h-12 w-12"></div>
                <p className="text-lg text-muted-foreground">Analyzing image...</p>
                <p className="text-sm text-muted-foreground">This may take a few moments</p>
              </div>
            ) : error ? (
              <div className="space-y-6">
                <div className="text-center p-6 bg-destructive/10 rounded-lg border border-destructive/20">
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-destructive mb-2">Prediction Failed</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-card rounded-lg border shadow-soft">
                    <h4 className="font-semibold text-muted-foreground mb-1">Error</h4>
                    <p className="text-xl font-semibold text-destructive">{error}</p>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    setSelectedFile(null);
                    setImagePreview(null);
                    setPrediction(null);
                    setError(null);
                  }}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  Try Another Image
                </Button>
              </div>
            ) : prediction ? (
              <div className="space-y-6">
                <div className="text-center p-6 bg-success/10 rounded-lg border border-success/20">
                  <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-success mb-2">Breed Identified!</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-card rounded-lg border shadow-soft">
                    <h4 className="font-semibold text-muted-foreground mb-1">Predicted Breed</h4>
                    <p className="text-2xl font-bold text-primary">{prediction.breed}</p>
                  </div>
                  
                  <div className="p-4 bg-card rounded-lg border shadow-soft">
                    <h4 className="font-semibold text-muted-foreground mb-1">Confidence Score</h4>
                    <p className="text-xl font-semibold text-accent">{prediction.confidence}</p>
                  </div>
                </div>

                <Button 
                  onClick={() => {
                    setSelectedFile(null);
                    setImagePreview(null);
                    setPrediction(null);
                    setError(null);
                  }}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  Analyze Another Image
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground" />
                <p className="text-lg text-muted-foreground text-center">
                  Upload an image to see prediction results
                </p>
                
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto mt-12 text-center">
        <div className="p-6 bg-card/50 rounded-lg shadow-soft backdrop-blur-sm">
          <p className="text-muted-foreground">
            Developed for <span className="font-semibold text-primary">Bharat Pashudhan App</span> | Amaravati, AP
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Supporting Indian livestock farmers with AI-powered breed recognition
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BreedRecognition;