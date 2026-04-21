# Use the official Python image as the base image
FROM python:3.10-slim

# Install system dependencies for C, C++, Java, JavaScript, and TypeScript execution
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    ca-certificates \
    openjdk-17-jdk \
    nodejs \
    npm \
    && apt-get clean

# Install TypeScript globally
RUN npm install -g typescript

# Install Flask and Gunicorn
RUN pip install Flask gunicorn flask_cors

# Copy the Flask app code
COPY ./app /app

# Set working directory
WORKDIR /app

# Expose port 6000
EXPOSE 6000

# Run app with Gunicorn
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:6000"]
