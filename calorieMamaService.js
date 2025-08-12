import { supabase } from '@/config/supabaseClient';
import { toast } from "@/components/ui/use-toast";

// This file might become obsolete if calorieScanner.js is preferred.
// For now, I'll keep its content as it was, but it's not actively used by TrackCaloriesPage anymore.

export async function analyzeMealWithCalorieMama(base64Image) {
  console.log("Frontend: analyzeMealWithCalorieMama called (old service).");
  if (!base64Image) {
    console.error("Frontend: base64Image is missing (old service).");
    toast({
      title: "Erreur d'image",
      description: "Aucune image fournie pour l'analyse.",
      variant: "destructive",
    });
    throw new Error("No image provided for analysis.");
  }

  try {
    console.log("Frontend: Invoking Supabase Edge Function 'calorie-mama-proxy' (old service).");
    const { data, error: functionError } = await supabase.functions.invoke('calorie-mama-proxy', {
      body: JSON.stringify({ base64Image }), 
    });

    if (functionError) {
      console.error("Frontend: Error invoking Edge Function (old service):", functionError);
      let errorMessage = functionError.message;
      if (functionError.context && typeof functionError.context.body === 'string') {
        try {
          const errorBody = JSON.parse(functionError.context.body);
          if (errorBody && errorBody.error) {
            errorMessage = `${errorMessage} - Détails: ${errorBody.error}`;
          }
        } catch (parseError) {
          // Le corps n'est pas du JSON ou est mal formé
        }
      } else if (typeof functionError === 'object' && functionError !== null) {
        errorMessage = JSON.stringify(functionError);
      }


      toast({
        title: "Erreur Service d'Analyse",
        description: `La communication avec le service a échoué. ${errorMessage}`,
        variant: "destructive",
        duration: 9000,
      });
      throw new Error(`Edge function invocation error: ${errorMessage}`);
    }

    console.log("Frontend: Data received from Edge Function (old service):", data);

    if (data && data.error) {
      console.error("Frontend: Error reported by Edge Function logic (old service):", data.error);
      toast({
        title: "Erreur d'Analyse (API)",
        description: data.error,
        variant: "destructive",
        duration: 9000,
      });
      throw new Error(`API error via proxy: ${data.error}`);
    }
    
    if (Array.isArray(data)) {
        console.log("Frontend: Successfully processed data from Edge Function (old service).");
        return data;
    } else {
        console.error("Frontend: Unexpected data format from Edge Function (old service). Expected array, got:", data);
        toast({
          title: "Erreur de Format de Données",
          description: "La réponse du service d'analyse est dans un format inattendu.",
          variant: "destructive",
        });
        throw new Error("Unexpected data format from proxy.");
    }

  } catch (error) {
    console.error("Frontend: General error in analyzeMealWithCalorieMama (old service):", error);
    if (!error.message.toLowerCase().includes("edge function") && !error.message.toLowerCase().includes("api error")) {
        toast({
            title: "Erreur Critique d'Analyse",
            description: error.message || "Une erreur inconnue est survenue.",
            variant: "destructive",
        });
    }
    throw error; 
  }
}
