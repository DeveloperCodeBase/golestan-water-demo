FROM node:20-alpine

WORKDIR /app

ARG NEXT_INTERNAL_API_URL=http://api:8000
ARG NEXT_PUBLIC_API_URL=/backend
ENV NEXT_INTERNAL_API_URL=${NEXT_INTERNAL_API_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
