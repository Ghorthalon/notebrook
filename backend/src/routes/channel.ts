import { Router } from 'express';
import * as ChannelController from '../controllers/channel-controller';
import { authenticate } from '../middleware/auth';

export const router = Router({mergeParams: true});

router.post('/', authenticate, ChannelController.createChannel);
router.get('/', authenticate, ChannelController.getChannels);
router.delete('/:channelId', authenticate, ChannelController.deleteChannel);
router.put('/:channelId/merge', authenticate, ChannelController.mergeChannel);
