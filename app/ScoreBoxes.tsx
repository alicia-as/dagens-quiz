interface EmojiScoreProps {
  average: number;
}

const ScoreBoxes: React.FC<EmojiScoreProps> = ({ average }) => {
  const totalQuestions = 5;
  const fullGreenBoxes = Math.floor(average * totalQuestions);
  const fractionalPart = (average * totalQuestions) % 1;
  const partialGreenWidth = fractionalPart; // Assuming a full box width of 4rem, adjust based on your design

  const redBoxes =
    totalQuestions - fullGreenBoxes - (fractionalPart > 0 ? 1 : 0);
  // Ensure partialRedWidth is only used if there's a fractional part and it doesn't fill a whole box.
  const partialRedWidth =
    fractionalPart > 0 && fullGreenBoxes + 1 < totalQuestions
      ? 1 - fractionalPart
      : 0;

  return (
    <div className="flex">
      {Array.from({ length: fullGreenBoxes }).map((_, i) => (
        <div key={`green-${i}`} className="w-4 h-4 bg-green-500 mr-1"></div>
      ))}
      {fractionalPart > 0 && (
        <div className="mr-1 flex">
          <div
            style={{ width: `${partialGreenWidth}rem` }}
            className="h-4 bg-green-500"
          ></div>

          {fractionalPart > 0 && fullGreenBoxes + 1 < totalQuestions && (
            <div
              style={{ width: `${partialRedWidth}rem` }}
              className="h-4 bg-red-500"
            ></div>
          )}
        </div>
      )}

      {Array.from({ length: redBoxes }).map((_, i) => (
        <div key={`red-${i}`} className="w-4 h-4 bg-red-500 mr-1"></div>
      ))}
    </div>
  );
};

export default ScoreBoxes;
