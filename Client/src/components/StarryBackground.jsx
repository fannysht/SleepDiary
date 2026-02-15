// Fond dynamique

import React, { useEffect } from "react";
import "../styles/starryBackground.css";

const StarryBackground = ({
  numberOfStars = 150,
  numberOfShootingStars = 5,
}) => {
  useEffect(() => {
    const container = document.querySelector(".starry-container");
    if (!container) return;

    container.innerHTML = "";

    // Créations des étoiles
    for (let i = 0; i < numberOfStars; i++) {
      const star = document.createElement("div");
      star.classList.add("star");

      const size = Math.random() * 3 + 1;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDuration = `${Math.random() * 2 + 1}s`;
      star.style.animationDelay = `${Math.random() * 2}s`;

      container.appendChild(star);
    }

    // Création des étoiles filantes
    const createShootingStar = () => {
      const shootingStar = document.createElement("div");
      shootingStar.classList.add("shooting-star");

      // Position de départ aléatoire
      const startX = Math.random() * 100;
      const startY = Math.random() * 60;

      shootingStar.style.left = `${startX}%`;
      shootingStar.style.top = `${startY}%`;

      // Distance et direction aléatoires
      const distance = Math.random() * 400 + 300;
      const angle = Math.random() * 60 + 30; // Entre 30° et 90°

      shootingStar.style.setProperty("--distance", `${distance}px`);
      shootingStar.style.setProperty("--angle", `${angle}deg`);

      // Durée et délai aléatoires
      const duration = Math.random() * 2 + 1.5; // 1.5s à 3.5s
      const delay = Math.random() * 10; // 0s à 10s

      shootingStar.style.animationDuration = `${duration}s`;
      shootingStar.style.animationDelay = `${delay}s`;

      container.appendChild(shootingStar);

      // Supprimer et recréer après l'animation
      setTimeout(
        () => {
          shootingStar.remove();
          if (container.querySelector(".starry-container")) {
            createShootingStar();
          }
        },
        (duration + delay) * 1000,
      );
    };

    // Création des étoiles filantes initiales
    for (let i = 0; i < numberOfShootingStars; i++) {
      setTimeout(() => createShootingStar(), i * 2000);
    }

    // Cleanup
    return () => {
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [numberOfStars, numberOfShootingStars]);

  return <div className="starry-container"></div>;
};

export default StarryBackground;
