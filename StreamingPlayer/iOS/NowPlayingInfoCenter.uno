using Uno;
using Uno.UX;
using Uno.Threading;
using Fuse.Scripting;
using Uno.Collections;
using Uno.Compiler.ExportTargetInterop;

namespace StreamingPlayer
{

	[ForeignInclude(Language.ObjC, "AVFoundation/AVFoundation.h")]

	[ForeignInclude(Language.ObjC, "MediaPlayer/MediaPlayer.h")]
	[Require("Xcode.Framework", "MediaPlayer")]

	[Require("Xcode.Framework", "CoreImage")]
	[ForeignInclude(Language.ObjC, "CoreImage/CoreImage.h")]
	extern(iOS) static class NowPlayingInfoCenter
	{


		public static void SetProgress(double progress)
		{
			SetProgressImpl(progress);
		}

		[Foreign(Language.ObjC)]
		static void SetProgressImpl(double progress)
		@{
			NSLog(@"trying to get play info to set progress");
			NSMutableDictionary *playInfo = [NSMutableDictionary dictionaryWithDictionary:[MPNowPlayingInfoCenter defaultCenter].nowPlayingInfo];

			NSLog(@"seeking to progress %f", progress);
			[playInfo setObject: [NSNumber numberWithDouble:progress] forKey:MPNowPlayingInfoPropertyElapsedPlaybackTime];
			[MPNowPlayingInfoCenter defaultCenter].nowPlayingInfo = playInfo;
		@}

		public static void SetTrackInfo(string title, string artistName, ObjC.Object artwork, double duration)
		{
			SetNowPlayingInfoCenterInfo(title, artistName, artwork, duration);
		}
		
		[Foreign(Language.ObjC)]
		static void SetNowPlayingInfoCenterInfo(string title, string artistName, ObjC.Object artwork, double duration)
		@{
			NSLog(@"trying to set artwork");
			MPMediaItemArtwork *aw = (MPMediaItemArtwork*)artwork;

			NSMutableDictionary *playInfo = [NSMutableDictionary dictionaryWithDictionary:[MPNowPlayingInfoCenter defaultCenter].nowPlayingInfo];

            [playInfo setObject: title forKey:MPMediaItemPropertyTitle];
			[playInfo setObject: artistName forKey:MPMediaItemPropertyArtist];
			[playInfo setObject: aw forKey:MPMediaItemPropertyArtwork];
			[playInfo setObject: [NSNumber numberWithDouble:duration] forKey:MPMediaItemPropertyPlaybackDuration];
			[playInfo setObject: [NSNumber numberWithDouble:0.0] forKey:MPNowPlayingInfoPropertyElapsedPlaybackTime];
			[MPNowPlayingInfoCenter defaultCenter].nowPlayingInfo = playInfo;
			NSLog(@"did set artwork and it seems to work yoooo");
		@}

		public static ObjC.Object CreateArtworkFromUrl(string url)
		{
			return MediaArtworkFromUrl(url);
		}

		[Foreign(Language.ObjC)]
		static ObjC.Object MediaArtworkFromUrl(string url)
		@{
			UIImage *uiImage = [UIImage imageWithData:[NSData dataWithContentsOfURL: [[NSURL alloc] initWithString: url]]];
			MPMediaItemArtwork *mediaArtwork = [[MPMediaItemArtwork alloc] initWithImage:uiImage];
			return mediaArtwork;
		@}
	}
}
