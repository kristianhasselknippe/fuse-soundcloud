using Uno;
using Uno.UX;
using Uno.Threading;
using Fuse.Scripting;
using Uno.Collections;
using Uno.Compiler.ExportTargetInterop;

namespace StreamingPlayer
{

	internal enum iOSPlayerState
	{
		Unknown, Initialized, Error
	}

	[ForeignInclude(Language.ObjC, "AVFoundation/AVFoundation.h")]

	[ForeignInclude(Language.ObjC, "MediaPlayer/MediaPlayer.h")]
	[Require("Xcode.Framework", "MediaPlayer")]

	[Require("Xcode.Framework", "CoreImage")]
	[ForeignInclude(Language.ObjC, "CoreImage/CoreImage.h")]
	extern(iOS) class StreamingPlayeriOSImpl : IAudioPlayer
	{

		static readonly string _statusName = "status";

		ObjC.Object _player;
		ObjC.Object CurrentPlayerItem
		{
			get { return GetCurrentPlayerItem(_player); }
		}
		
		List<Track> _tracks = new List<Track>();
		
		public event StatusChangedHandler StatusChanged;
		public event Action CurrentTrackChanged;
		public event Action<bool> HasNextChanged;
		public event Action<bool> HasPreviousChanged;

		iOSPlayerState _internalState = iOSPlayerState.Unknown;

		static StreamingPlayeriOSImpl _current;

		public void Play(Track track)
		{
			if (_player == null){
				_player = Create(track.Url);
				ObserverProxy.AddObserver(CurrentPlayerItem, _statusName, 0, OnInternalStateChanged);
			}
			else
			{
				_internalState = iOSPlayerState.Unknown;
				ObserverProxy.RemoveObserver(CurrentPlayerItem, _statusName);
				CancelPendingPrerolls(_player);
				AssignNewPlayerItemWithUrl(_player, track.Url);
				ObserverProxy.AddObserver(CurrentPlayerItem, _statusName, 0, OnInternalStateChanged);
			}

			NowPlayingInfoCenter.SetTrackInfo(track.Name,
											  track.Name, //TODO (get artist name)
											  NowPlayingInfoCenter.CreateArtworkFromUrl(track.ArtworkUrl),
											  track.Duration);

			CurrentTrack = track;
			if (_internalState == iOSPlayerState.Initialized)
			{
				StartPreroll();
			}
		}

		public void Resume()
		{
			if (_player != null)
			{
				PlayImpl(_player);
				Status = PlayerStatus.Playing;
			}
		}

		public void Pause()
		{
			if (_player != null)
			{
				
				PauseImpl(_player);
				Status = PlayerStatus.Paused;
			}
		}

		public void Stop()
		{
			if (_player != null)
			{
				SetPosition(_player, 0.0);
				CancelPendingPrerolls(_player);
				ObserverProxy.RemoveObserver(CurrentPlayerItem, _statusName);
				StopAndRelease(_player);
				Status = PlayerStatus.Stopped;
				_internalState = iOSPlayerState.Unknown;
				_player = null;
			}
		}

		public void Seek(double toProgress)
		{
			if (Status == PlayerStatus.Loading)
				return;
			var time = Duration * toProgress;
			SetPosition(_player, time);
			NowPlayingInfoCenter.SetProgress(toProgress * Duration);
		}

		public double Duration
		{
			get { return (_player != null) ? GetDuration(_player) : 0.0; }
		}

		public double Progress
		{
			get { return (_player != null) ? GetPosition(_player) : 0.0; }
		}

		PlayerStatus _status = PlayerStatus.Stopped;
		public PlayerStatus Status
		{
			get
			{
				if (_player != null)
				{
					switch (_internalState)
					{
						case iOSPlayerState.Unknown:
							return PlayerStatus.Stopped;
						case iOSPlayerState.Initialized:
							return _status;
						default:
							return PlayerStatus.Error;
					}
				}
				return PlayerStatus.Error;
			}
			private set
			{
				_status = value;
				OnStatusChanged();
			}
		}

		void StartPreroll()
		{
			Status = PlayerStatus.Loading;
			Preroll(_player, PrerollCompleted);
		}

		void PrerollCompleted(bool finished)
		{
			if (finished)
			{
				Status = PlayerStatus.Playing;
				PlayImpl(_player);
			}
			else
			{
				//TODO: What to do here
				//Status = PlayerStatus.Stopped;
			}
		}

		string InternalStateToString(int s)
		{
			switch (s)
			{
				case 0: return "Unknown";
				case 1: return "Initialized";
				default: return "Error";
			}
		}
		void OnInternalStateChanged()
		{
			var newState = GetStatus(_player);
			var lastState = _internalState;
			switch (newState)
			{
				case 0: _internalState = iOSPlayerState.Unknown; break;
				case 1: _internalState = iOSPlayerState.Initialized; break;
				default: _internalState = iOSPlayerState.Error; break;
			}
			if (_internalState == iOSPlayerState.Initialized && _internalState != lastState)
				StartPreroll();
		}

		void OnStatusChanged()
		{
			debug_log("ios: Status changed: " + Status);
			if (_internalState == iOSPlayerState.Initialized && Status == PlayerStatus.Stopped)
				StartPreroll();

			if (StatusChanged != null)
				StatusChanged(Status);
		}


		[Foreign(Language.ObjC)]
		int GetStatus(ObjC.Object player)
		@{
			AVPlayer* p = (AVPlayer*)player;
			return [p status];
		@}

		[Foreign(Language.ObjC)]
		void StopAndRelease(ObjC.Object player)
		@{
			AVPlayer* p = (AVPlayer*)player;
			[p pause];
			[p release];
		@}

		[Foreign(Language.ObjC)]
		static ObjC.Object Create(string url)
		@{
			return 	[[AVPlayer alloc] initWithURL:[[NSURL alloc] initWithString: url]];
		@}

		[Foreign(Language.ObjC)]
		void AssignNewPlayerItemWithUrl(ObjC.Object player, string url)
		@{
			AVPlayer* p = (AVPlayer*)player;
			p.rate = 0.0f;
			AVPlayerItem* item = [[AVPlayerItem alloc] initWithURL: [[NSURL alloc] initWithString: url]];
			[p replaceCurrentItemWithPlayerItem: item];
		@}

		[Foreign(Language.ObjC)]
		void PlayImpl(ObjC.Object player)
		@{
			AVPlayer* p = (AVPlayer*)player;
			[p play];
		@}

		[Foreign(Language.ObjC)]
		void PauseImpl(ObjC.Object player)
		@{
			AVPlayer* p = (AVPlayer*)player;
			[p pause];
		@}

		[Foreign(Language.ObjC)]
		void Preroll(ObjC.Object player, Action<bool> completed)
		@{
			AVPlayer* p = (AVPlayer*)player;
			float rate = p.rate;
			AVPlayerStatus status = p.status;
			//NSLog(@"starting preroll foreign, Rate: %f, Status: %ld", rate, (long)status);
			[p prerollAtRate:1.0f
			 completionHandler: ^ (BOOL finished) {
					//NSLog(@"Preroll completed foreign callback");
					completed(finished);
			 }];
		@}

		[Foreign(Language.ObjC)]
		void CancelPendingPrerolls(ObjC.Object player)
		@{
			AVPlayer* p = (AVPlayer*)player;
			[p cancelPendingPrerolls];
		@}

		[Foreign(Language.ObjC)]
		double GetDuration(ObjC.Object player)
		@{
			AVPlayer* p = (AVPlayer*)player;
			return CMTimeGetSeconds([[[p currentItem] asset] duration]);
		@}

		[Foreign(Language.ObjC)]
		double GetPosition(ObjC.Object player)
		@{
			AVPlayer* p = (AVPlayer*)player;
			return CMTimeGetSeconds([[p currentItem] currentTime]);
		@}


		[Foreign(Language.ObjC)]
		void SetPosition(ObjC.Object player, double position)
		@{
			AVPlayer* p = (AVPlayer*)player;
			[p seekToTime: CMTimeMake(position * 1000, 1000)];
		@}

		[Foreign(Language.ObjC)]
		ObjC.Object GetCurrentPlayerItem(ObjC.Object player)
		@{
			AVPlayer* p = (AVPlayer*)player;
			return p.currentItem;
		@}



		public StreamingPlayeriOSImpl()
		{
			new LockScreenMediaControlsiOSImpl();
		}

		Track _currentTrack;
		public Track CurrentTrack
		{
			get
			{
				return _currentTrack;
			}
			set
			{
				_currentTrack = value;
				OnCurrentTrackChanged();
			}
		}

		public bool HasNext
		{
			get
			{
				if (CurrentTrack == null)
					return false;
				var index = _tracks.IndexOf(CurrentTrack);
				var ret = index > -1 && index < _tracks.Count - 1;
				return ret;
			}
		}

		public bool HasPrevious
		{
			get
			{
				if (CurrentTrack == null)
					return false;
				var ret = _tracks.IndexOf(CurrentTrack) > 0;
				return ret;
			}
		}

		void OnCurrentTrackChanged()
		{
			if (CurrentTrackChanged != null)
				CurrentTrackChanged();
			OnHasNextOrHasPreviousChanged();
		}

		public void AddTrack(Track track)
		{
			_tracks.Add(track);
			OnHasNextOrHasPreviousChanged();
		}

		public void SetPlaylist(Track[] tracks)
		{
			_tracks.Clear();
			if (tracks == null)
				return;
			foreach (var t in tracks)
				_tracks.Add(t);
			OnHasNextOrHasPreviousChanged();
		}

		public int Next()
		{
			if (HasNext)
			{
				var newTrack = _tracks[_tracks.IndexOf(_currentTrack) + 1];
				Play(newTrack);
				CurrentTrack = newTrack;
				return newTrack.Id;
			}
			return -1;
		}

		public int Previous()
		{
			if (HasPrevious)
			{
				var newTrack = _tracks[_tracks.IndexOf(_currentTrack) - 1];
				Play(newTrack);
				CurrentTrack = newTrack;
				return newTrack.Id;
			}
			return -1;
		}

		void OnHasNextOrHasPreviousChanged()
		{
			if (HasNextChanged != null)
				HasNextChanged(HasNext);
			if (HasPreviousChanged != null)
				HasPreviousChanged(HasPrevious);
		}
	}
}
