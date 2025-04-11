import React from 'react';

const ReviewCard = ({ review }) => {
  const formattedDate = new Date(review.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <img
            src={review.passenger?.photo || '/images/default-avatar.png'}
            alt={review.passenger?.name}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h3 className="font-medium">{review.passenger?.name}</h3>
            <p className="text-sm text-gray-500">{formattedDate}</p>
          </div>
        </div>
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className={`material-icons-outlined text-sm ${
                i < review.rating ? 'text-yellow-400' : 'text-gray-300'
              }`}
            >
              star
            </span>
          ))}
        </div>
      </div>
      {review.comment && (
        <p className="mt-4 text-gray-600">{review.comment}</p>
      )}
    </div>
  );
};

export default ReviewCard; 