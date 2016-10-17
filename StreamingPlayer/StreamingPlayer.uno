using Uno;
using Uno.UX;
using Uno.Threading;
using Fuse;
using Fuse.Scripting;
using Uno.Collections;
using Uno.Compiler.ExportTargetInterop;

namespace StreamingPlayer
{
	public class StreamingPlayer : IAudioPlayer
	{
		static StreamingPlayer _current;
		public static StreamingPlayer Current
		{
			get { return _current; }
			private set { _current = value; }
		}
		
		IAudioPlayer _player;
		
		public event StatusChangedHandler StatusChanged;

		public event Action CurrentTrackChanged;

		public StreamingPlayer()
		{
			Current = this;
			
			if defined(Android)
			{
				_player = new StreamingPlayerAndroidImpl();
			}
			else if defined(iOS)
			{
				_player = new StreamingPlayeriOSImpl();
			}
			else
				_player = new StreamingPlayerDummyImpl();


			if (!Marshal.CanConvertClass(typeof(Track)))
				Marshal.AddConverter(new TrackConverter());


			_player.CurrentTrackChanged += OnCurrentTrackChanged;
			_player.HasNextChanged += OnHasNextChanged;
			_player.HasPreviousChanged += OnHasPreviousChanged;
			_player.StatusChanged += OnStatusChanged;
		}

		void OnStatusChanged(PlayerStatus status)
		{
			if (StatusChanged != null)
				StatusChanged(status);
		}

		public void Play(Track track){
			_player.Play(track);
		}

		void OnCurrentTrackChanged()
		{
			if (CurrentTrackChanged != null)
				CurrentTrackChanged();
		}
		
		public void Seek(double toProgress)
		{
			_player.Seek(toProgress);
		}
		
		public void Pause(){ _player.Pause(); }
		public void Resume(){ _player.Resume(); }
		public void Stop(){ _player.Stop(); }

		public double Duration { get { return _player.Duration; } }
		public double Progress { get { return _player.Progress; } }

		public PlayerStatus Status { get { return _player.Status; } }

		public int Next() { return _player.Next(); }
		public int Previous() { return _player.Previous(); }
		public void AddTrack(Track track) { _player.AddTrack(track); }
		public void SetPlaylist(Track[] tracks) { _player.SetPlaylist(tracks); }

		public Track CurrentTrack { get { return _player.CurrentTrack; } }
		public bool HasNext { get { return _player.HasNext; } }
		public bool HasPrevious { get { return _player.HasPrevious; } }

		public event Action<bool> HasNextChanged;
		public event Action<bool> HasPreviousChanged;

		void OnHasNextChanged(bool val)
		{
			if (HasNextChanged != null)
				HasNextChanged(val);
		}
		void OnHasPreviousChanged(bool val)
		{
			if (HasPreviousChanged != null)
				HasPreviousChanged(val);
		}
	}
}
