
import apiClient from './apiClient';

export const recycleBinApi = {
  getAll:     ()       => apiClient.get('/recycle-bin').then(r => r.data),
  restore:    (items)  => apiClient.post('/recycle-bin/restore', { items }).then(r => r.data),
  hardDelete: (items)  => apiClient.delete('/recycle-bin/hard-delete', { data: { items } }).then(r => r.data),
  empty:      ()       => apiClient.delete('/recycle-bin/empty').then(r => r.data),
};