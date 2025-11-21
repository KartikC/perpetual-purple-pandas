import { useEffect } from 'react';

export default function KoFiWidget() {
    useEffect(() => {
        const scriptId = "ko-fi-script";

        if (document.getElementById(scriptId)) {
            return;
        }

        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://storage.ko-fi.com/cdn/scripts/overlay-widget.js";
        script.async = true;
        script.onload = () => {
            if (typeof kofiWidgetOverlay !== 'undefined') {
                kofiWidgetOverlay.draw("sathaxe", {
                    type: "floating-chat",
                    "floating-chat.donateButton.text": "Tip Me",
                    "floating-chat.donateButton.background-color": "#323842",
                    "floating-chat.donateButton.text-color": "#fff",
                });
            }
        };

        document.body.appendChild(script);

        return () => {
            const scriptElement = document.getElementById(scriptId);
            if (scriptElement) {
                document.body.removeChild(scriptElement);
            }
            // Also remove the widget iframe if it exists, as the script might leave it
            const widget = document.querySelector('.kofi-widget-overlay-floating-chat');
            if (widget) {
                widget.remove();
            }
        };
    }, []);

    return null;
}
