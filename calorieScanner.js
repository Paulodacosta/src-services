import { toast } from "@/components/ui/use-toast";

export async function sendImageToCalorieMamaProxy(base64Image) {
  const supabaseUrl = "https://mwhhrfozbfqqomxgvbgr.supabase.co";
  const functionName = "calorie-mama-proxy";
  const proxyUrl = `${supabaseUrl}/functions/v1/${functionName}`;

  console.log("Frontend: Calling CalorieMama Proxy via fetch:", proxyUrl);

  if (!base64Image) {
    console.error("Frontend: base64Image is missing for sendImageToCalorieMamaProxy.");
    toast({
      title: "Erreur d'image",
      description: "Aucune image fournie pour l'analyse.",
      variant: "destructive",
    });
    throw new Error("No image provided for analysis.");
  }

  try {
    const response = await fetch(proxyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Si votre Edge Function requiert une authentification (par exemple, via le token Supabase),
        // vous devrez l'ajouter ici. Pour l'instant, l'Edge Function est configurée sans --no-verify-jwt implicitement
        // ou explicitement, donc elle devrait être accessible publiquement ou via la clé anon si configurée ainsi.
        // "Authorization": `Bearer ${YOUR_SUPABASE_ANON_KEY_OR_USER_TOKEN}` 
        // Cependant, pour les appels de fonction, la clé anon est souvent gérée par le client Supabase.
        // Pour un fetch direct, si la fonction n'est pas totalement publique, un token peut être nécessaire.
        // L'Edge Function que j'ai écrite précédemment n'incluait pas de vérification JWT explicite.
      },
      body: JSON.stringify({ base64Image: base64Image }) // L'Edge Function s'attend à { base64Image: "..." }
    });

    console.log("Frontend: Proxy response status:", response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Frontend: Proxy API Error:", response.status, errorBody);
      toast({
        title: `Erreur API (${response.status})`,
        description: `La communication avec le service d'analyse a échoué. Détails: ${errorBody}`,
        variant: "destructive",
        duration: 9000,
      });
      throw new Error(`Erreur API : ${response.status} - ${errorBody}`);
    }

    const data = await response.json();
    console.log("Frontend: Data received from proxy:", data);

    // L'Edge Function est censée renvoyer un tableau d'objets food.
    if (Array.isArray(data)) {
        if (data.length === 0) {
            console.warn("Frontend: Proxy returned an empty array. No food items recognized.");
            toast({
                title: "Aucun aliment reconnu",
                description: "L'analyse n'a pas permis d'identifier d'aliments dans l'image.",
                variant: "warning",
            });
        }
        return data;
    } else if (data && data.error) {
        console.error("Frontend: Error explicitly returned by proxy logic:", data.error);
        toast({
            title: "Erreur du Service d'Analyse",
            description: data.error,
            variant: "destructive",
        });
        throw new Error(data.error);
    } else {
        console.error("Frontend: Unexpected data format from proxy. Expected array, got:", data);
        toast({
          title: "Erreur de Format de Données",
          description: "La réponse du service d'analyse est dans un format inattendu.",
          variant: "destructive",
        });
        throw new Error("Unexpected data format from proxy.");
    }

  } catch (error) {
    console.error("Frontend: Erreur lors de l'appel à CalorieMama Proxy:", error.message);
    // Si le toast n'a pas déjà été affiché pour une erreur plus spécifique
    if (!error.message.toLowerCase().includes("api") && !error.message.toLowerCase().includes("service d'analyse")) {
        toast({
            title: "Erreur de Connexion",
            description: "Impossible de joindre le service d'analyse. Vérifiez votre connexion internet.",
            variant: "destructive",
        });
    }
    throw error;
  }
}