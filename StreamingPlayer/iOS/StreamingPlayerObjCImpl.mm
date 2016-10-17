#import "iOS/StreamingPlayerObjCImpl.h"

@implementation StreamingPlayerObjCImpl {
}

- (void) playFromUrl:(NSString*) url {
	self.player = [[AVPlayer alloc]initWithURL:[NSURL URLWithString:url]];
	[[NSNotificationCenter defaultCenter] addObserver:self
											 selector:@selector(playerItemDidReachEnd:)
												 name:AVPlayerItemDidPlayToEndTimeNotification
											   object:[self.player currentItem]];
	[self.player addObserver:self forKeyPath:@"status" options:0 context:nil];
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context {

	if (object == self.player && [keyPath isEqualToString:@"status"]) {
		if (self.player.status == AVPlayerStatusFailed) {
			NSLog(@"AVPlayer Failed");

		} else if (self.player.status == AVPlayerStatusReadyToPlay) {
			NSLog(@"AVPlayerStatusReadyToPlay");
			[self.player play];


		} else if (self.player.status == AVPlayerItemStatusUnknown) {
			NSLog(@"AVPlayer Unknown");

		}
	}
}

- (void)playerItemDidReachEnd:(NSNotification *)notification {

	//  code here to play next sound file

}

- (void) pause {

}

- (void) stop {

}

@end
