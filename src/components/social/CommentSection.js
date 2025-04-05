import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { addComment, getPostComments, deleteComment } from '../../services/socialService';
import { formatDistanceToNow } from 'date-fns';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from '@mui/material/CircularProgress';

const CommentSection = ({ postId, darkMode }) => {
  const { currentUser } = useAuth();
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Fetch comments when component mounts
  useEffect(() => {
    const fetchComments = async () => {
      if (!postId) return;
      
      setLoading(true);
      try {
        const fetchedComments = await getPostComments(postId);
        setComments(fetchedComments);
        setError('');
      } catch (err) {
        console.error('Error fetching comments:', err);
        setError('Failed to load comments. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchComments();
  }, [postId]);
  
  // Handle comment submission
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('You must be logged in to comment');
      return;
    }
    
    if (!comment.trim()) {
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      const newComment = await addComment(currentUser.uid, postId, comment);
      
      // Add user info to the comment for display
      newComment.user = {
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        id: currentUser.uid
      };
      
      // Add to comment list and clear input
      setComments(prevComments => [newComment, ...prevComments]);
      setComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle comment deletion
  const handleDeleteComment = async (commentId) => {
    if (!currentUser) return;
    
    try {
      await deleteComment(currentUser.uid, commentId, postId);
      setComments(prevComments => prevComments.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment. Please try again.');
    }
  };
  
  return (
    <CommentSectionContainer darkMode={darkMode}>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {/* Comment input */}
      <CommentForm onSubmit={handleSubmitComment} darkMode={darkMode}>
        <CommentInput
          type="text"
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={submitting}
          darkMode={darkMode}
        />
        <SubmitButton 
          type="submit" 
          disabled={!comment.trim() || submitting}
          darkMode={darkMode}
        >
          {submitting ? (
            <CircularProgress size={20} style={{ color: 'inherit' }} />
          ) : (
            <SendIcon style={{ fontSize: '18px' }} />
          )}
        </SubmitButton>
      </CommentForm>
      
      {/* Comments list */}
      <CommentsList>
        {loading ? (
          <LoadingContainer>
            <CircularProgress size={30} style={{ color: darkMode ? '#e0e8ff' : '#6A6AE3' }} />
          </LoadingContainer>
        ) : comments.length === 0 ? (
          <NoCommentsMessage darkMode={darkMode}>
            No comments yet. Be the first to comment!
          </NoCommentsMessage>
        ) : (
          comments.map(comment => (
            <CommentItem key={comment.id} darkMode={darkMode}>
              <CommentHeader>
                <UserAvatar>
                  <img 
                    src={comment.user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.displayName || 'User')}&background=random`} 
                    alt={comment.user?.displayName || 'User'} 
                  />
                </UserAvatar>
                <CommentContent>
                  <CommentUser darkMode={darkMode}>
                    {comment.user?.displayName || 'User'}
                  </CommentUser>
                  <CommentText darkMode={darkMode}>
                    {comment.content}
                  </CommentText>
                  <CommentTimestamp darkMode={darkMode}>
                    {comment.timestamp ? formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true }) : 'Just now'}
                  </CommentTimestamp>
                </CommentContent>
                {currentUser && currentUser.uid === comment.userId && (
                  <DeleteButton 
                    onClick={() => handleDeleteComment(comment.id)}
                    darkMode={darkMode}
                  >
                    <CloseIcon style={{ fontSize: '16px' }} />
                  </DeleteButton>
                )}
              </CommentHeader>
            </CommentItem>
          ))
        )}
      </CommentsList>
    </CommentSectionContainer>
  );
};

// Styled components
const CommentSectionContainer = styled.div`
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid ${props => props.darkMode ? '#34495e' : '#ecf0f1'};
`;

const CommentForm = styled.form`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  position: relative;
`;

const CommentInput = styled.input`
  flex: 1;
  padding: 12px 15px;
  border-radius: 20px;
  border: 1px solid ${props => props.darkMode ? '#34495e' : '#e0e0e0'};
  background-color: ${props => props.darkMode ? '#2c3e50' : '#f8f9fa'};
  color: ${props => props.darkMode ? '#e0e8ff' : '#333'};
  font-size: 14px;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${props => props.darkMode ? '#6A6AE3' : '#6A6AE3'};
  }
  
  &::placeholder {
    color: ${props => props.darkMode ? '#7f8c8d' : '#aaa'};
  }
`;

const SubmitButton = styled.button`
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: ${props => props.darkMode ? '#6A6AE3' : '#6A6AE3'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  
  &:disabled {
    color: ${props => props.darkMode ? '#7f8c8d' : '#ccc'};
    cursor: not-allowed;
  }
`;

const CommentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const CommentItem = styled.div`
  padding: 10px 0;
  border-bottom: 1px solid ${props => props.darkMode ? '#34495e' : '#f0f0f0'};
  
  &:last-child {
    border-bottom: none;
  }
`;

const CommentHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  position: relative;
`;

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const CommentContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const CommentUser = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: ${props => props.darkMode ? '#e0e8ff' : '#333'};
`;

const CommentText = styled.div`
  font-size: 14px;
  color: ${props => props.darkMode ? '#bdc3c7' : '#555'};
  line-height: 1.4;
  word-break: break-word;
`;

const CommentTimestamp = styled.div`
  font-size: 12px;
  color: ${props => props.darkMode ? '#7f8c8d' : '#999'};
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.darkMode ? '#7f8c8d' : '#aaa'};
  cursor: pointer;
  padding: 5px;
  margin-left: auto;
  opacity: 0.7;
  
  &:hover {
    opacity: 1;
    color: ${props => props.darkMode ? '#e74c3c' : '#e74c3c'};
  }
`;

const ErrorMessage = styled.div`
  background-color: #ffebee;
  color: #d32f2f;
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 10px;
  font-size: 14px;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 20px 0;
`;

const NoCommentsMessage = styled.div`
  text-align: center;
  padding: 15px 0;
  color: ${props => props.darkMode ? '#7f8c8d' : '#999'};
  font-style: italic;
  font-size: 14px;
`;

export default CommentSection; 