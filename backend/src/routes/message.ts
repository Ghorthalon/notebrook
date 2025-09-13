import { Router } from 'express';
import * as MessageController from '../controllers/message-controller';
import { authenticate } from '../middleware/auth';

export const router = Router({mergeParams: true});

router.post('/', authenticate, MessageController.createMessage);
router.put('/:messageId', authenticate, MessageController.updateMessage);
router.put('/:messageId/move', authenticate, MessageController.moveMessage);
router.put('/:messageId/checked', authenticate, MessageController.setChecked);
router.delete('/:messageId', authenticate, MessageController.deleteMessage);
router.get('/', authenticate, MessageController.getMessages);

