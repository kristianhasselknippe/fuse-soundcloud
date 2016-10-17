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
	[ForeignInclude(Language.ObjC, "AudioToolbox/AudioToolbox.h")]
	[Require("Xcode.Framework", "MediaPlayer")]
	[Require("Xcode.Plist.Element", "<key>UIBackgroundModes</key><array><string>audio</string></array>")]
	extern(iOS) class LockScreenMediaControlsiOSImpl
	{
		public LockScreenMediaControlsiOSImpl()
		{
			debug_log("Registering handlers");
			RegisterHandlers(Next,Previous,Play,Pause);
		}

		void Next()
		{
			debug_log("next Uno");
			StreamingPlayer.Current.Next();
			debug_log("Did try next in uno");
		}
		void Previous()
		{
			debug_log("previous Uno");
			StreamingPlayer.Current.Previous();
		}
		void Play()
		{
			debug_log("play Uno");
			StreamingPlayer.Current.Resume();
		}

		void Pause()
		{
			debug_log("pause Uno");
			StreamingPlayer.Current.Pause();
		}

		[Foreign(Language.ObjC)]
		void RegisterHandlers(Action next, Action previous, Action play, Action pause)
		@{
			AVAudioSession *audioSession = [AVAudioSession sharedInstance];

			NSError *setCategoryError = nil;
			BOOL success = [audioSession setCategory:AVAudioSessionCategoryPlayback error:&setCategoryError];
			if (!success) { NSLog(@"Error setting category"); }

			NSError *activationError = nil;
			success = [audioSession setActive:YES error:&activationError];
			if (!success) { NSLog(@"Error setting active audio session"); }


			MPRemoteCommandCenter *commandCenter = [MPRemoteCommandCenter sharedCommandCenter];
        	[commandCenter.playCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent *event) {
        	    NSLog(@"Play button pressed");
				play();
        	    return MPRemoteCommandHandlerStatusSuccess;
        	}];
		    [commandCenter.pauseCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent *event) {
        	    NSLog(@"Pause button pressed");
				pause();
        	    return MPRemoteCommandHandlerStatusSuccess;
        	}];		
        	[commandCenter.nextTrackCommand addTargetWithHandler:^(MPRemoteCommandEvent *event) {
        		// Begin playing the current track.
        		NSLog(@"Remote control: next track command");
				next();
        	    return MPRemoteCommandHandlerStatusSuccess;
        	}];
        	[commandCenter.previousTrackCommand addTargetWithHandler:^(MPRemoteCommandEvent *event) {
        		// Begin playing the current track.
        		NSLog(@"Remote control: previous track command");
				previous();
        	    return MPRemoteCommandHandlerStatusSuccess;
        	}];
		@}

	}

}
