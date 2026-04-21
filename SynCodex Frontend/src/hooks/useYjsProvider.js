import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { useEffect } from "react";

export const useYjsProvider = (roomId) => {
  const yDoc = new Y.Doc();

  const serverUrl = "ws://localhost:1234"

  const provider = new WebsocketProvider(serverUrl, roomId, yDoc);

  useEffect(() => {
      const raw = localStorage.getItem("synSession");
      if (raw && provider) {
        try {
          const parsed = JSON.parse(raw);
          provider.awareness.setLocalStateField("sessionInfo", {
            name: parsed.name
          })
        } catch (error) {
          console.error("Failed to parse project data:", error);
        }
      }
  }, []);

  if (provider){
    console.log("Initialized WebSocket provider for room:", roomId);
  }

  return { yDoc, provider };
};
