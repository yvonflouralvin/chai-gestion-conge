FROM node:22-bullseye

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier tout le projet
COPY . .

# Builder l'application Next.js
RUN npm run build

# Port utilisé par Next.js
EXPOSE 3000

# Démarrer l'application
CMD ["npm", "start", "-p", "3000", "-H", "0.0.0.0"]
