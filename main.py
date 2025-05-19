import pygame
import sys
import random
import math
import json
from leaderboard import Leaderboard
from saves import save_data, load_data

# Constants
WIDTH, HEIGHT = 800, 900
BALL_RADIUS = 20
OBSTACLE_RADIUS = 40
GRAVITY = 0.35
FPS = 60

# Colors
WHITE = (255,255,255)
BLACK = (0,0,0)
RED = (255,0,0)
GREEN = (0,255,0)
BLUE = (0,0,255)
YELLOW = (255,255,0)

# Cosmetic options
BALL_COLORS = [RED, GREEN, BLUE, YELLOW]

class Ball:
    def __init__(self, x, y, color):
        self.x = x
        self.y = y
        self.vx = 0
        self.vy = 0
        self.color = color
        self.active = True

    def update(self, obstacles):
        self.vy += GRAVITY
        self.x += self.vx
        self.y += self.vy

        # Wall collision
        if self.x < BALL_RADIUS:
            self.x = BALL_RADIUS
            self.vx *= -0.7
        elif self.x > WIDTH - BALL_RADIUS:
            self.x = WIDTH - BALL_RADIUS
            self.vx *= -0.7

        # Obstacle collision
        for ox, oy in obstacles:
            dx = self.x - ox
            dy = self.y - oy
            dist = math.hypot(dx, dy)
            if dist < BALL_RADIUS + OBSTACLE_RADIUS:
                angle = math.atan2(dy, dx)
                # Bounce away from obstacle
                self.vx += math.cos(angle) * 5
                self.vy += math.sin(angle) * 5

    def draw(self, screen):
        pygame.draw.circle(screen, self.color, (int(self.x), int(self.y)), BALL_RADIUS)

class Game:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT))
        pygame.display.set_caption("Ball Bet Game")
        self.clock = pygame.time.Clock()
        self.font = pygame.font.SysFont(None, 32)
        self.reset()
        self.leaderboard = Leaderboard()
        self.data = load_data()
        self.tokens = self.data.get("tokens", 100)
        self.selected_color = self.data.get("color", 0)
        self.running = True

    def reset(self):
        self.bet = 0
        self.drop_x = WIDTH // 2
        self.ball = None
        self.finished = False
        self.obstacles = [(random.randint(100, 700), 200),
                          (random.randint(100, 700), 375),
                          (random.randint(100, 700), 550),
                          (random.randint(100, 700), 725)]
        self.message = "Place your bet and choose drop position!"

    def save_progress(self):
        save_data({"tokens": self.tokens, "color": self.selected_color})

    def run(self):
        input_active = False
        input_text = ""
        while self.running:
            self.clock.tick(FPS)
            self.screen.fill(WHITE)
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    self.save_progress()
                    pygame.quit()
                    sys.exit()
                elif event.type == pygame.MOUSEBUTTONDOWN:
                    mx, my = pygame.mouse.get_pos()
                    if not self.ball:
                        # Set drop_x
                        if 0 < my < HEIGHT - 50:
                            self.drop_x = mx
                    # Cosmetic buttons
                    for idx, col in enumerate(BALL_COLORS):
                        if 10+idx*50 < mx < 10+idx*50+40 and HEIGHT-45 < my < HEIGHT-5:
                            if self.tokens >= 10 or idx == 0:
                                self.selected_color = idx
                                if idx != 0:
                                    self.tokens -= 10
                                    self.message = "Bought new color!"
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_RETURN and not self.ball:
                        if input_text.isdigit() and int(input_text) > 0 and int(input_text) <= self.tokens:
                            self.bet = int(input_text)
                            self.tokens -= self.bet
                            self.ball = Ball(self.drop_x, BALL_RADIUS, BALL_COLORS[self.selected_color])
                            self.message = "Watch your ball go!"
                            input_text = ""
                            input_active = False
                        else:
                            self.message = "Invalid bet!"
                    elif event.key == pygame.K_BACKSPACE:
                        input_text = input_text[:-1]
                    elif event.unicode.isdigit() and not self.ball:
                        input_text += event.unicode

            # Update
            if self.ball and not self.finished:
                self.ball.update(self.obstacles)
                if self.ball.y > HEIGHT - BALL_RADIUS:
                    self.finished = True
                    payout = int(self.bet * random.uniform(1.5, 3.0))
                    self.tokens += payout
                    self.leaderboard.add_score(payout)
                    self.message = f"Ball finished! You won {payout} tokens! Press R to play again."
                    self.save_progress()
            # Draw
            # Obstacles
            for ox, oy in self.obstacles:
                pygame.draw.circle(self.screen, BLACK, (ox, oy), OBSTACLE_RADIUS)
            # Ball
            if self.ball:
                self.ball.draw(self.screen)
            # UI
            self.screen.blit(self.font.render(f"Tokens: {self.tokens}", True, BLACK), (WIDTH-200, 10))
            self.screen.blit(self.font.render("Ball Cosmetics:", True, BLACK), (10, HEIGHT-60))
            for idx, col in enumerate(BALL_COLORS):
                pygame.draw.rect(self.screen, col, (10+idx*50, HEIGHT-45, 40, 40))
                if idx == self.selected_color:
                    pygame.draw.rect(self.screen, BLACK, (10+idx*50, HEIGHT-45, 40, 40), 3)
                if idx != 0:
                    self.screen.blit(self.font.render("10", True, BLACK), (10+idx*50+10, HEIGHT-25))
            # Bet input
            if not self.ball:
                pygame.draw.rect(self.screen, (200,200,200), (WIDTH//2-100, HEIGHT-80, 200, 40))
                self.screen.blit(self.font.render(f"Bet: {input_text or ''}", True, BLACK), (WIDTH//2-90, HEIGHT-76))
                self.screen.blit(self.font.render("Click to set drop position, Enter to bet!", True, BLACK), (WIDTH//2-160, HEIGHT-120))
            # Drop position
            if not self.ball:
                pygame.draw.circle(self.screen, BALL_COLORS[self.selected_color], (self.drop_x, BALL_RADIUS*2), BALL_RADIUS)
            # Message
            self.screen.blit(self.font.render(self.message, True, BLACK), (10, 10))
            # Leaderboard
            self.leaderboard.draw(self.screen, WIDTH-250, 80)
            pygame.display.flip()

            # Controls
            keys = pygame.key.get_pressed()
            if keys[pygame.K_r] and self.finished:
                self.reset()
            if keys[pygame.K_ESCAPE]:
                self.save_progress()
                pygame.quit()
                sys.exit()

if __name__ == "__main__":
    Game().run()
