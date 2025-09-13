class SimonGame {
    constructor() {
        this.sequence = [];
        this.playerSequence = [];
        this.level = 0;
        this.score = 0;
        this.isPlaying = false;
        this.isPlayerTurn = false;
        this.colors = ['green', 'red', 'yellow', 'blue'];
        this.sounds = {};
        
        this.initializeElements();
        this.initializeSounds();
        this.bindEvents();
        this.updateDisplay();
    }
    
    initializeElements() {
        this.startBtn = document.getElementById('start-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.helpBtn = document.getElementById('help-btn');
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.statusElement = document.getElementById('status-message');
        this.colorButtons = this.colors.map(color => document.getElementById(color));
        
        // Modal elements
        this.modal = document.getElementById('instructions-modal');
        this.closeModalBtn = document.getElementById('close-modal');
    }
    
    initializeSounds() {
        // Create audio contexts for different tones
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Define frequencies for each color
        this.frequencies = {
            green: 329.63,  // E4
            red: 261.63,    // C4
            yellow: 391.95, // G4
            blue: 220.00    // A3
        };
    }
    
    playSound(color, duration = 600) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(this.frequencies[color], this.audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration / 1000);
    }
    
    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.helpBtn.addEventListener('click', () => this.showModal());
        
        // Modal events
        this.closeModalBtn.addEventListener('click', () => this.hideModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });
        
        this.colorButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                if (this.isPlayerTurn && !button.classList.contains('disabled')) {
                    this.handlePlayerInput(this.colors[index]);
                }
            });
        });
        
        // Add keyboard support
        document.addEventListener('keydown', (e) => {
            const keyMap = {
                'q': 'green',
                'w': 'red',
                'a': 'yellow',
                's': 'blue',
                'Escape': 'close-modal'
            };
            
            if (keyMap[e.key.toLowerCase()] === 'close-modal') {
                this.hideModal();
            } else if (keyMap[e.key.toLowerCase()] && this.isPlayerTurn) {
                this.handlePlayerInput(keyMap[e.key.toLowerCase()]);
            }
        });
    }
    
    startGame() {
        if (this.isPlaying) return;
        
        // Resume audio context if needed
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.isPlaying = true;
        this.level = 1;
        this.score = 0;
        this.sequence = [];
        this.playerSequence = [];
        
        this.startBtn.disabled = true;
        this.updateDisplay();
        this.updateStatus('Watch the sequence...');
        
        this.nextRound();
    }
    
    resetGame() {
        this.isPlaying = false;
        this.isPlayerTurn = false;
        this.level = 0;
        this.score = 0;
        this.sequence = [];
        this.playerSequence = [];
        
        this.startBtn.disabled = false;
        this.enableButtons();
        this.updateDisplay();
        this.updateStatus('Ready to play?');
        
        // Remove any active classes
        this.colorButtons.forEach(button => {
            button.classList.remove('active', 'disabled');
        });
    }
    
    nextRound() {
        this.isPlayerTurn = false;
        this.playerSequence = [];
        
        // Add a new color to the sequence
        const randomColor = this.colors[Math.floor(Math.random() * this.colors.length)];
        this.sequence.push(randomColor);
        
        this.updateDisplay();
        this.disableButtons();
        
        // Wait a moment before showing the sequence
        setTimeout(() => {
            this.playSequence();
        }, 1000);
    }
    
    playSequence() {
        this.updateStatus(`Level ${this.level} - Watch the sequence!`);
        
        this.sequence.forEach((color, index) => {
            setTimeout(() => {
                this.flashButton(color);
            }, (index + 1) * 900);
        });
        
        // Enable player input after sequence is complete
        setTimeout(() => {
            this.isPlayerTurn = true;
            this.enableButtons();
            this.updateStatus('Your turn! Repeat the sequence');
        }, (this.sequence.length + 1) * 900);
    }
    
    flashButton(color) {
        const button = document.getElementById(color);
        button.classList.add('active');
        this.playSound(color, 700);
        
        setTimeout(() => {
            button.classList.remove('active');
        }, 700);
    }
    
    handlePlayerInput(color) {
        if (!this.isPlayerTurn) return;
        
        this.playerSequence.push(color);
        this.flashButton(color);
        
        const currentIndex = this.playerSequence.length - 1;
        
        // Check if the player's input matches the sequence
        if (this.playerSequence[currentIndex] !== this.sequence[currentIndex]) {
            this.gameOver();
            return;
        }
        
        // Check if player completed the sequence
        if (this.playerSequence.length === this.sequence.length) {
            this.score += this.level * 10;
            this.level++;
            this.updateDisplay();
            
            this.isPlayerTurn = false;
            this.disableButtons();
            this.updateStatus('Correct! Next level coming...');
            
            setTimeout(() => {
                this.nextRound();
            }, 1500);
        }
    }
    
    gameOver() {
        this.isPlaying = false;
        this.isPlayerTurn = false;
        this.disableButtons();
        
        this.updateStatus(`GAME OVER! Final Score: ${this.score}`);
        this.startBtn.disabled = false;
        
        // Play game over sound
        this.playGameOverSound();
        
        // Flash all buttons with error effect
        this.colorButtons.forEach((button, index) => {
            setTimeout(() => {
                button.style.filter = 'brightness(0.3) saturate(0)';
                setTimeout(() => {
                    button.style.filter = '';
                }, 200);
            }, index * 100);
        });
        
        // Reset button styles after animation
        setTimeout(() => {
            this.colorButtons.forEach(button => {
                button.style.filter = '';
                button.classList.remove('active', 'disabled');
            });
        }, 1500);
    }
    
    playGameOverSound() {
        const frequencies = [200, 150, 100];
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                oscillator.type = 'sawtooth';
                
                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.5);
            }, index * 200);
        });
    }
    
    enableButtons() {
        this.colorButtons.forEach(button => {
            button.classList.remove('disabled');
        });
    }
    
    disableButtons() {
        this.colorButtons.forEach(button => {
            button.classList.add('disabled');
        });
    }
    
    updateDisplay() {
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
    }
    
    updateStatus(message) {
        this.statusElement.textContent = message;
        
        // Add pulse effect to status display
        const statusDisplay = this.statusElement.parentElement;
        statusDisplay.classList.add('pulse-effect');
        setTimeout(() => {
            statusDisplay.classList.remove('pulse-effect');
        }, 1000);
    }
    
    showModal() {
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    hideModal() {
        this.modal.style.display = 'none';
        document.body.style.overflow = 'hidden';
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new SimonGame();
    
    // Add entrance animation for instruction items
    const instructionItems = document.querySelectorAll('.instruction-item');
    instructionItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'all 0.6s ease';
        
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 150 + 500);
    });
    
    // Add entrance animation for game buttons
    const gameButtons = document.querySelectorAll('.simon-button');
    gameButtons.forEach((button, index) => {
        button.style.opacity = '0';
        button.style.transform = 'scale(0.8)';
        button.style.transition = 'all 0.8s ease';
        
        setTimeout(() => {
            button.style.opacity = '1';
            button.style.transform = 'scale(1)';
        }, index * 100 + 200);
    });
});
