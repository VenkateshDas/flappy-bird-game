import React, { useState, useEffect, useCallback, useRef } from 'react';

// Game physics constants - adjusted for best practice
const GRAVITY = 0.45;
const JUMP_STRENGTH = -7;
const PIPE_WIDTH = 50;
const INITIAL_PIPE_GAP = 200;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 500;

const birdSkins = [
  'yellow',
  'blue',
  'red',
];

const Bird = ({ y, skin }) => (
  <div style={{
    position: 'absolute',
    left: '50px',
    top: `${y}px`,
    width: '50px',
    height: '50px',
    backgroundImage: `url(${process.env.PUBLIC_URL}/bird.png)`,
    backgroundSize: 'cover',
  }} />
);

const Pipe = ({ x, topHeight, gap }) => (
    <div>
      <div style={{
        position: 'absolute',
        left: `${x}px`,
        top: '0',
        width: `${PIPE_WIDTH}px`,
        height: `${topHeight}px`,
        backgroundColor: 'green',
      }} />
      <div style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${topHeight + gap}px`,
        width: `${PIPE_WIDTH}px`,
        bottom: '0',
        backgroundColor: 'green',
      }} />
    </div>
  );

const Game = () => {
  const [birdY, setBirdY] = useState(GAME_HEIGHT / 2);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => localStorage.getItem('highScore') || 0);
  const [gameStarted, setGameStarted] = useState(false);
  const [birdSkin, setBirdSkin] = useState(birdSkins[0]);
  const gameAreaRef = useRef(null);

  const jump = useCallback(() => {
    if (!gameOver) {
      setBirdVelocity(JUMP_STRENGTH);
      if (!gameStarted) {
        setGameStarted(true);
      }
    }
  }, [gameOver, gameStarted]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space') {
        jump();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [jump]);

  useEffect(() => {
    if (!gameStarted) return;
    if (gameOver) return;

    const gameLoop = setInterval(() => {
      setBirdY((y) => Math.max(0, Math.min(y + birdVelocity, GAME_HEIGHT - 30)));
      setBirdVelocity((v) => v + GRAVITY);

      setPipes((pipes) => {
        const newPipes = pipes
          .map((pipe) => ({ ...pipe, x: pipe.x - 3 }))
          .filter((pipe) => pipe.x > -PIPE_WIDTH);
        if (pipes.length === 0 || pipes[pipes.length - 1]?.x < GAME_WIDTH - 200) {
          const newPipeTop = Math.random() * (GAME_HEIGHT - INITIAL_PIPE_GAP - 100) + 50;
          const currentGap = Math.max(100, INITIAL_PIPE_GAP - Math.floor(score / 10)); // Decrease gap as score increases
          newPipes.push({ x: GAME_WIDTH, topHeight: newPipeTop, gap: currentGap });
        }
        return newPipes;
      });

      setScore((score) => score + 1);

      // Collision detection
      if (birdY <= 0 || birdY >= GAME_HEIGHT - 30) {
        setGameOver(true);
      }

      pipes.forEach((pipe) => {
        if (
          pipe.x < 80 && pipe.x + PIPE_WIDTH > 50 &&
          (birdY < pipe.topHeight || birdY + 30 > pipe.topHeight + pipe.gap)
        ) {
          setGameOver(true);
        }
      });
    }, 20);

    return () => {
      clearInterval(gameLoop);
    };
  }, [birdY, birdVelocity, pipes, gameOver, gameStarted]);

  const restartGame = () => {
    setBirdY(GAME_HEIGHT / 2);
    setBirdVelocity(0);
    setPipes([]);
    setGameOver(false);
    setScore(0);
    setGameStarted(false);
    const newHighScore = Math.max(score, highScore);
    setHighScore(newHighScore);
    localStorage.setItem('highScore', newHighScore);
  };

  useEffect(() => {
    if (gameAreaRef.current) {
      gameAreaRef.current.focus();
    }
  }, []);

  return (
    <div 
      ref={gameAreaRef}
      style={{ 
        width: `${GAME_WIDTH}px`, 
        height: `${GAME_HEIGHT}px`, 
        backgroundColor: 'skyblue', 
        position: 'relative', 
        overflow: 'hidden',
        outline: 'none',
        cursor: 'pointer',
      }}
      onClick={jump}
      onKeyDown={(e) => e.code === 'Space' && jump()}
      tabIndex={0}
    >
      <Bird y={birdY} skin={birdSkin} />
      {pipes.map((pipe, index) => (
        <Pipe key={index} x={pipe.x} topHeight={pipe.topHeight} gap={pipe.gap} />
      ))}
      <div style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '24px' }}>
        Score: {score}
      </div>
      <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '24px' }}>
        High Score: {highScore}
      </div>
      {!gameStarted && !gameOver && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}>
          <h2>Flappy Bird</h2>
          <p>Click or press Space to start and jump</p>
          <p>Select your bird:</p>
          <div>
            {birdSkins.map((skin) => (
              <div
                key={skin}
                onClick={() => setBirdSkin(skin)}
                style={{
                  display: 'inline-block',
                  width: '30px',
                  height: '30px',
                  backgroundImage: `url(${process.env.PUBLIC_URL}/bird.png)`,
                  backgroundSize: 'cover',
                  borderRadius: '50%',
                  margin: '0 5px',
                  cursor: 'pointer',
                  border: skin === birdSkin ? '2px solid black' : 'none',
                }}
              />
            ))}
          </div>
        </div>
      )}
      {gameOver && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}>
          <h2>Game Over</h2>
          <p>Your score: {score}</p>
          <button onClick={restartGame}>Restart</button>
        </div>
      )}
    </div>
  );
};

export default Game;
