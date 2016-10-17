#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>

@interface StreamingPlayerObjCImpl : NSObject {
    // Protected instance variables (not recommended)
}

@property(copy) AVPlayer* player;

- (void) playFromUrl:(NSString*) url;
- (void) pause;
- (void) stop;

@end
