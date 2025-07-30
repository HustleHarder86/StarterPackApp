/**
 * Animated Background Component
 * Creates floating gradient orbs with parallax effect
 */

export const AnimatedBackground = ({ 
  variant = 'default',
  opacity = 0.4 
}) => {
  const variants = {
    default: `
      <div class="orb w-96 h-96 gradient-primary absolute -top-48 -left-48 floating"></div>
      <div class="orb w-64 h-64 gradient-warning absolute top-96 -right-32 floating-delayed"></div>
      <div class="orb w-80 h-80 gradient-success absolute -bottom-32 left-1/2 floating"></div>
    `,
    hero: `
      <div class="orb w-[500px] h-[500px] gradient-primary absolute -top-64 -left-64 floating"></div>
      <div class="orb w-[400px] h-[400px] gradient-warning absolute top-64 -right-48 floating-delayed"></div>
      <div class="orb w-[350px] h-[350px] gradient-success absolute -bottom-48 left-1/3 floating"></div>
      <div class="orb w-[300px] h-[300px] gradient-primary absolute top-1/2 right-1/3 floating-delayed"></div>
    `,
    subtle: `
      <div class="orb w-64 h-64 gradient-primary absolute top-20 left-20 floating"></div>
      <div class="orb w-48 h-48 gradient-success absolute bottom-20 right-20 floating-delayed"></div>
    `
  };

  return `
    <div class="fixed inset-0 overflow-hidden pointer-events-none" style="opacity: ${opacity}">
      <div class="gradient-mesh absolute inset-0"></div>
      ${variants[variant]}
    </div>
  `;
};

export const ParallaxBackground = () => {
  return `
    <div id="parallax-bg" class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="gradient-mesh absolute inset-0"></div>
      <div id="orb1" class="orb w-96 h-96 gradient-primary absolute -top-48 -left-48 floating"></div>
      <div id="orb2" class="orb w-64 h-64 gradient-warning absolute top-96 -right-32 floating-delayed"></div>
      <div id="orb3" class="orb w-80 h-80 gradient-success absolute -bottom-32 left-1/2 floating"></div>
    </div>
    <script>
      // Parallax effect on mouse move
      document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        const orb1 = document.getElementById('orb1');
        const orb2 = document.getElementById('orb2');
        const orb3 = document.getElementById('orb3');
        
        if (orb1) {
          orb1.style.transform = \`translate(\${mouseX * 20}px, \${mouseY * 20}px)\`;
        }
        if (orb2) {
          orb2.style.transform = \`translate(\${mouseX * -30}px, \${mouseY * -30}px)\`;
        }
        if (orb3) {
          orb3.style.transform = \`translate(\${mouseX * 15}px, \${mouseY * -15}px)\`;
        }
      });
    </script>
  `;
};

export const GradientOverlay = ({ 
  direction = 'to-bottom',
  opacity = 0.5 
}) => {
  const directionClasses = {
    'to-bottom': 'bg-gradient-to-b',
    'to-top': 'bg-gradient-to-t',
    'to-right': 'bg-gradient-to-r',
    'to-left': 'bg-gradient-to-l'
  };

  return `
    <div class="absolute inset-0 ${directionClasses[direction]} from-purple-600/20 to-pink-600/20 pointer-events-none" 
         style="opacity: ${opacity}">
    </div>
  `;
};

export const AnimatedGradientText = ({ 
  text, 
  size = 'text-4xl',
  className = '' 
}) => {
  return `
    <h1 class="${size} font-bold ${className}">
      <span class="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent animate-gradient-x">
        ${text}
      </span>
    </h1>
    <style>
      @keyframes gradient-x {
        0%, 100% {
          background-size: 200% 200%;
          background-position: left center;
        }
        50% {
          background-size: 200% 200%;
          background-position: right center;
        }
      }
      .animate-gradient-x {
        animation: gradient-x 5s ease infinite;
      }
    </style>
  `;
};