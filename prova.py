import pygame
import random
import time

# Screen dimensions
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600

# Paddle settings
PADDLE_WIDTH = 10
PADDLE_HEIGHT = 100
PADDLE_SPEED = 10

# Ball settings
BALL_SIZE = 10
BALL_SPEED_X = 5
BALL_SPEED_Y = 5

# AI update frequency
# AI update interval in seconds
AI_UPDATE_INTERVAL = 0
last_ai_update_time = time.time()

# AI target position for the paddle


pygame.init()
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption("Pong with AI")

# Paddle positions
player_paddle_pos = SCREEN_HEIGHT // 2 - PADDLE_HEIGHT // 2
ai_paddle_pos = SCREEN_HEIGHT // 2 - PADDLE_HEIGHT // 2

ai_target_pos = ai_paddle_pos

# Ball position and velocity
ball_pos = [SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2]
ball_velocity = [BALL_SPEED_X, BALL_SPEED_Y]

def move_paddle(paddle_pos, target_pos, speed):
    if paddle_pos < target_pos:
        return min(paddle_pos + speed, target_pos)
    elif paddle_pos > target_pos:
        return max(paddle_pos - speed, target_pos)
    return paddle_pos

reaction_delay = 1
counter = 0

def ai_update(ball_pos, ball_velocity):
    global ai_target_pos, counter

    # Only update the AI's target position every 'reaction_delay' frames
    counter += 1
    if counter % reaction_delay != 0:
        return

    # Calculate the ball's projected position when it reaches the AI paddle side
    if ball_velocity[0] > 0:  # If ball is moving toward the AI paddle
        time_to_reach_ai = (SCREEN_WIDTH - PADDLE_WIDTH - BALL_SIZE - ball_pos[0]) / ball_velocity[0]
        intercept_y = ball_pos[1] + ball_velocity[1] * time_to_reach_ai

        # Handle bounces off top/bottom walls
        while intercept_y < 0 or intercept_y > SCREEN_HEIGHT:
            if intercept_y < 0:
                intercept_y = -intercept_y
            else:
                intercept_y = 2 * SCREEN_HEIGHT - intercept_y

        # Set the target position for the AI paddle with some randomness
        randomness = random.uniform(-50, 50)
        ai_target_pos = intercept_y - PADDLE_HEIGHT // 2 + randomness

        # Ensure the target position is within paddle movement limits
        ai_target_pos = max(0, min(SCREEN_HEIGHT - PADDLE_HEIGHT, ai_target_pos))

running = True
ai_welcome = True
while running:
    # Handle events
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    if ai_welcome:
        ai_update(ball_pos, ball_velocity)
        ai_welcome = False
    # Update AI paddle at specified intervals
    current_time = time.time()
    if current_time - last_ai_update_time >= AI_UPDATE_INTERVAL:
        ai_update(ball_pos, ball_velocity)
        last_ai_update_time = current_time

    # Incrementally move the AI paddle toward the target position
    ai_paddle_pos = move_paddle(ai_paddle_pos, ai_target_pos, PADDLE_SPEED // 2)

    keys = pygame.key.get_pressed()
    # Other game logic for player movement, ball movement, and collisions
    # Player paddle movement
    if keys[pygame.K_UP]:
        player_paddle_pos = max(0, player_paddle_pos - PADDLE_SPEED)
    elif keys[pygame.K_DOWN]:
        player_paddle_pos = min(SCREEN_HEIGHT - PADDLE_HEIGHT, player_paddle_pos + PADDLE_SPEED)

    # Ball movement and bouncing logic
    ball_pos[0] += ball_velocity[0]
    ball_pos[1] += ball_velocity[1]

    # Handle top and bottom wall bounces
    if ball_pos[1] <= 0 or ball_pos[1] >= SCREEN_HEIGHT - BALL_SIZE:
        ball_velocity[1] *= -1

    # Paddle collisions and score checks
    if ball_pos[0] <= PADDLE_WIDTH:  # Player's paddle
        if player_paddle_pos <= ball_pos[1] <= player_paddle_pos + PADDLE_HEIGHT:
            ball_velocity[0] *= -1
        else:
            print("","AI Wins!")
            running = False

    if ball_pos[0] >= SCREEN_WIDTH - PADDLE_WIDTH - BALL_SIZE:  # AI's paddle
        if ai_paddle_pos <= ball_pos[1] <= ai_paddle_pos + PADDLE_HEIGHT:
            ball_velocity[0] *= -1
        else:
            print("Player Wins!")
            running = False

    # Render the game screen
    screen.fill((0, 0, 0))
    pygame.draw.rect(screen, (255, 255, 255), (0, player_paddle_pos, PADDLE_WIDTH, PADDLE_HEIGHT))
    pygame.draw.rect(screen, (255, 255, 255), (SCREEN_WIDTH - PADDLE_WIDTH, ai_paddle_pos, PADDLE_WIDTH, PADDLE_HEIGHT))
    pygame.draw.ellipse(screen, (255, 255, 255), (ball_pos[0], ball_pos[1], BALL_SIZE, BALL_SIZE))

    pygame.display.flip()  # Refresh the screen
    pygame.time.Clock().tick(60)  # Control frame rate at 60 FPS

pygame.quit()
