import pygame
import random
import sys
import math

# Initialize pygame
pygame.init()

# Constants
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600
BALL_RADIUS = 10
PADDLE_WIDTH = 20
PADDLE_HEIGHT = 100
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
BALL_COLOR = (0, 255, 0)
PADDLE_COLOR = (255, 0, 0)
SPEED_INCREMENT_BASE = 0.5

# Initialize the screen
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption("Pong Game")

# Game state
state = {
    'ball_x': 400,
    'ball_y': 290,
    'ball_speed_x': random.choice([-4, 4]),
    'ball_speed_y': random.choice([-4, 4]),
    'paddle1_y': 250,
    'paddle2_y': 250,
    'paddle1_speed_y': 0,
    'paddle2_speed_y': 0,
}

PADDLE1_X = 0
PADDLE2_X = SCREEN_WIDTH - PADDLE_WIDTH
PADDLE_SPEED = 5
game_started = False

def map_value(value, from_low, from_high, to_low, to_high):
    from_range = from_high - from_low
    to_range = to_high - to_low
    scaled_value = float(value - from_low) / float(from_range)
    return to_low + (scaled_value * to_range)

def check_collision(state):
    ball_x = state['ball_x']
    ball_y = state['ball_y']
    ball_speed_x = state['ball_speed_x']
    ball_speed_y = state['ball_speed_y']
    paddle1_y = state['paddle1_y']
    paddle2_y = state['paddle2_y']
    paddle1_speed_y = state['paddle1_speed_y']
    paddle2_speed_y = state['paddle2_speed_y']
    
    def calculate_reflection(paddle_y, paddle_x, ball_x, ball_y, paddle_speed_y):
        diff = ball_y - (paddle_y + PADDLE_HEIGHT / 2)
        normalized_diff = diff / (PADDLE_HEIGHT / 2)
        reflection_angle = normalized_diff * (math.pi / 4)
        speed = math.sqrt(ball_speed_x**2 + ball_speed_y**2)
        new_speed_x = speed * math.cos(reflection_angle)
        new_speed_y = speed * math.sin(reflection_angle)
        
        if ball_x < SCREEN_WIDTH / 2:
            new_speed_x = abs(new_speed_x)  # Ball moves to the right
        else:
            new_speed_x = -abs(new_speed_x)  # Ball moves to the left

        # Increase speed if hit near top or bottom of the paddle
        if ball_y <= paddle_y or ball_y >= paddle_y + PADDLE_HEIGHT:
            speed_increase = SPEED_INCREMENT_BASE + abs(paddle_speed_y) * 0.1
            speed += speed_increase
            new_speed_x = speed * math.cos(reflection_angle)
            new_speed_y = speed * math.sin(reflection_angle)
            if ball_x < SCREEN_WIDTH / 2:
                new_speed_x = abs(new_speed_x)
            else:
                new_speed_x = -abs(new_speed_x)
        
        return new_speed_x, new_speed_y, (ball_x, ball_y, ball_x + new_speed_x * 10, ball_y + new_speed_y * 10)

    if (PADDLE1_X <= ball_x <= PADDLE1_X + PADDLE_WIDTH) or (PADDLE2_X <= ball_x <= PADDLE2_X + PADDLE_WIDTH):
            if (paddle1_y <= ball_y - 5 <= paddle1_y + PADDLE_HEIGHT) or (paddle2_y <= ball_y + 5 <= paddle2_y + PADDLE_HEIGHT):
                return False, None
    # Collision with paddle 1 (left paddle)
    if ball_x - BALL_RADIUS <= PADDLE1_X + PADDLE_WIDTH:
        if paddle1_y - BALL_RADIUS <= ball_y <= paddle1_y + PADDLE_HEIGHT + BALL_RADIUS:
            state['ball_speed_x'], state['ball_speed_y'], line_to_draw = calculate_reflection(paddle1_y, PADDLE1_X, ball_x, ball_y, paddle1_speed_y)
            return True, line_to_draw

    # Collision with paddle 2 (right paddle)
    if ball_x + BALL_RADIUS >= PADDLE2_X:
        if paddle2_y - BALL_RADIUS <= ball_y <= paddle2_y + PADDLE_HEIGHT + BALL_RADIUS:
            state['ball_speed_x'], state['ball_speed_y'], line_to_draw = calculate_reflection(paddle2_y, PADDLE2_X, ball_x, ball_y, paddle2_speed_y)
            return True, line_to_draw
    
    return False, None

def draw_paddle(x, y):
    pygame.draw.rect(screen, PADDLE_COLOR, (x, y, PADDLE_WIDTH, PADDLE_HEIGHT))

def draw_ball(x, y):
    pygame.draw.circle(screen, BALL_COLOR, (x, y), BALL_RADIUS)

def draw_direction_line(start_pos, end_pos):
    pygame.draw.line(screen, WHITE, start_pos, end_pos, 2)

# Main game loop
running = True
line_to_draw = None

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
            break
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_RETURN:
                game_started = True
    
    keys = pygame.key.get_pressed()
    state['paddle1_speed_y'] = 0
    state['paddle2_speed_y'] = 0
    
    if keys[pygame.K_w] and state['paddle1_y'] > 0:
        state['paddle1_y'] -= PADDLE_SPEED
        state['paddle1_speed_y'] = -PADDLE_SPEED
    if keys[pygame.K_s] and state['paddle1_y'] < SCREEN_HEIGHT - PADDLE_HEIGHT:
        state['paddle1_y'] += PADDLE_SPEED
        state['paddle1_speed_y'] = PADDLE_SPEED
    if keys[pygame.K_UP] and state['paddle2_y'] > 0:
        state['paddle2_y'] -= PADDLE_SPEED
        state['paddle2_speed_y'] = -PADDLE_SPEED
    if keys[pygame.K_DOWN] and state['paddle2_y'] < SCREEN_HEIGHT - PADDLE_HEIGHT:
        state['paddle2_y'] += PADDLE_SPEED
        state['paddle2_speed_y'] = PADDLE_SPEED

    if game_started:
        state['ball_x'] += state['ball_speed_x']
        state['ball_y'] += state['ball_speed_y']
    else:
        mouse_x, mouse_y = pygame.mouse.get_pos()
        state['ball_x'], state['ball_y'] = mouse_x, mouse_y

    # Ball collision with top and bottom walls
    if state['ball_y'] - BALL_RADIUS <= 0:
        state['ball_y'] = BALL_RADIUS
        state['ball_speed_y'] = abs(state['ball_speed_y'])
    if state['ball_y'] + BALL_RADIUS >= SCREEN_HEIGHT:
        state['ball_y'] = SCREEN_HEIGHT - BALL_RADIUS
        state['ball_speed_y'] = -abs(state['ball_speed_y'])

    collision, line_to_draw = check_collision(state)
    
    screen.fill(BLACK)

    draw_paddle(PADDLE1_X, state['paddle1_y'])
    draw_paddle(PADDLE2_X, state['paddle2_y'])
    draw_ball(state['ball_x'], state['ball_y'])

    if line_to_draw:
        draw_direction_line(line_to_draw[:2], line_to_draw[2:])

    pygame.display.flip()
    pygame.time.Clock().tick(60)

pygame.quit()
sys.exit()
