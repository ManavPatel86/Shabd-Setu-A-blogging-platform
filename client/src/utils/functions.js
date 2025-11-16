export const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export const getDisplayName = (user) => {
  if (!user) return 'Unknown user';
  const trimmedName = typeof user.name === 'string' ? user.name.trim() : '';
  if (trimmedName) {
    return trimmedName;
  }
  if (user.username) {
    return `@${user.username}`;
  }
  if (user.email) {
    return user.email.split('@')[0];
  }
  return 'Unknown user';
};
