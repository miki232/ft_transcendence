# ft_transcendence

## Overview
Welcome to **ft_transcendence**, a project designed to challenge your skills and creativity by building a multiplayer Pong game with a modern web interface. This project encourages you to dive into new territories and make critical decisions in software development.

## Table of Contents
1. [Project Description](#project-description)
2. [Features](#features)
3. [Technical Requirements](#technical-requirements)
4. [Modules](#modules)
5. [Setup and Installation](#setup-and-installation)
6. [Contributing](#contributing)

## Project Description
The ft_transcendence project is about creating a website where users can play Pong against each other. The goal is to provide an engaging and smooth user experience with real-time multiplayer capabilities. The project requires you to implement various technical aspects while adhering to specific constraints and guidelines.

## Features
- Real-time Pong game with multiplayer support
- User registration and matchmaking system
- Tournament mode for multiple players
- Secure and responsive web interface

## Technical Requirements
The project must meet the following minimum technical requirements:
- **Frontend**: Pure vanilla JavaScript (overridable by the FrontEnd module)
- **Backend**: Pure Ruby if a backend is included (overridable by the Framework module)
- **Single-Page Application**: Compatible with the latest stable version of Google Chrome
- **Docker**: Single command line deployment (`docker-compose up --build`)

## Modules 11.5/10
The project can be extended by implementing various modules. Each module has specific requirements and can replace or add to the basic functionality. The Modules done in this project are, **11.5 modules done on 10 required**:
- **Web**: Framework backend (Django), front-end framework (Bootstrap), database backend (PostgreSQL)
- **User Management**: Standard user management, remote authentication (42 OAuth)
- **Gameplay and User Experience**: Remote players, Game Customization Options, Live Chat
- **AI-Algo**: AI opponent, user and game stats dashboards
- **Cybersecurity**: GDPR compliance
- **Accessibility**: Expanding Browser Compatibility, Multiple language supports
- **Server-Side Pong**: Server-Side Pong, Pong Gameplay via CLI against Web Users



## Setup and Installation
1. Clone the repository:
   ```sh
   git clone git@github.com:miki232/ft_transcendence.git
   cd ft_transcendence
   ```

2. Create SSL and .env file:
	```sh
	make ssl-certificate
	make generate-env
	```

3. Launch Docker Compose:
	```sh
	docker compose up
	```

## Contributing

This project was collaboratively developed by a dedicated team, with each member focusing on specific aspects to bring the project to life:

- **mtoia** - Backend development and architecture. [LinkedIn](https://www.linkedin.com/in/michele-toia-7328a9200/) [GitHub](https://github.com/miki232)
- **Arecce** - Frontend development and design. <!--[LinkedIn](your-linkedin-url-for-arecce)--> [GitHub](https://github.com/Sepherd)
- **Lbusi** - Frontend development and translations. <!--[LinkedIn](your-linkedin-url-for-lbusi)--> [GitHub](https://github.com/FriiKz)
- **Gifulvi** - Backend development for the LiveChat feature. [LinkedIn](https://www.linkedin.com/in/giacomo-fulvi/) [GitHub](https://github.com/giacominho3)

We welcome contributions from the community. If you're interested in helping improve Transcendence, please feel free to fork the repository, make your changes, and submit a pull request.