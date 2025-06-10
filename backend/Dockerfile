FROM node:16-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el resto de los archivos
COPY . .

# Crear directorios necesarios con permisos
RUN mkdir -p uploads temp_uploads
RUN chmod 777 uploads temp_uploads

# Puerto a exponer
EXPOSE 4000

# Variable de entorno para producción
ENV NODE_ENV=production

# Comando para iniciar la aplicación
CMD ["node", "server.js"] 