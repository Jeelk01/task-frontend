export const getSocketUrl = (namespace: string) => {
  const gqlUrl = import.meta.env.VITE_GRAPHQL_URL;
  let baseUrl = "http://localhost:4000";
      // let baseUrl = "http://172.31.192.1:4000";

  if (gqlUrl) {
    // Extract base origin from graphql url (e.g., http://localhost:4000/graphql -> http://localhost:4000)
    baseUrl = gqlUrl.replace(/\/graphql$/, "");
  } else {
    const origin = window.location.origin;
    
    // Support for Dev Tunnels: Replace frontend port with backend port in the hostname
    // Example: https://xxx-8080.inc1.devtunnels.ms -> https://xxx-4000.inc1.devtunnels.ms
    if (origin.includes('.devtunnels.ms')) {
      baseUrl = origin.replace(/-8080\./, '-4000\.').replace(/-5173\./, '-4000\.');
    } else {
      const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('5173') || origin.includes('8080');
      
      baseUrl = isLocal 
        ? origin.replace(/:\d+$/, ':4000') 
        : origin;
    }

    // Diagnostic: If we are falling back to a derived URL, log it
    console.log(`%c[Socket] URL Resolution: ${origin} -> ${baseUrl}`, "color: #8b5cf6");
  }

  return `${baseUrl}/${namespace}`;
};
