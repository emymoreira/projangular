import { computeStyle } from '../../util';
export class WebAnimationsPlayer {
    constructor(element, keyframes, options, _specialStyles) {
        this.element = element;
        this.keyframes = keyframes;
        this.options = options;
        this._specialStyles = _specialStyles;
        this._onDoneFns = [];
        this._onStartFns = [];
        this._onDestroyFns = [];
        this._initialized = false;
        this._finished = false;
        this._started = false;
        this._destroyed = false;
        // the following original fns are persistent copies of the _onStartFns and _onDoneFns
        // and are used to reset the fns to their original values upon reset()
        // (since the _onStartFns and _onDoneFns get deleted after they are called)
        this._originalOnDoneFns = [];
        this._originalOnStartFns = [];
        this.time = 0;
        this.parentPlayer = null;
        this.currentSnapshot = new Map();
        this._duration = options['duration'];
        this._delay = options['delay'] || 0;
        this.time = this._duration + this._delay;
    }
    _onFinish() {
        if (!this._finished) {
            this._finished = true;
            this._onDoneFns.forEach(fn => fn());
            this._onDoneFns = [];
        }
    }
    init() {
        this._buildPlayer();
        this._preparePlayerBeforeStart();
    }
    _buildPlayer() {
        if (this._initialized)
            return;
        this._initialized = true;
        const keyframes = this.keyframes;
        // @ts-expect-error overwriting a readonly property
        this.domPlayer = this._triggerWebAnimation(this.element, keyframes, this.options);
        this._finalKeyframe = keyframes.length ? keyframes[keyframes.length - 1] : new Map();
        this.domPlayer.addEventListener('finish', () => this._onFinish());
    }
    _preparePlayerBeforeStart() {
        // this is required so that the player doesn't start to animate right away
        if (this._delay) {
            this._resetDomPlayerState();
        }
        else {
            this.domPlayer.pause();
        }
    }
    _convertKeyframesToObject(keyframes) {
        const kfs = [];
        keyframes.forEach(frame => {
            kfs.push(Object.fromEntries(frame));
        });
        return kfs;
    }
    /** @internal */
    _triggerWebAnimation(element, keyframes, options) {
        return element.animate(this._convertKeyframesToObject(keyframes), options);
    }
    onStart(fn) {
        this._originalOnStartFns.push(fn);
        this._onStartFns.push(fn);
    }
    onDone(fn) {
        this._originalOnDoneFns.push(fn);
        this._onDoneFns.push(fn);
    }
    onDestroy(fn) {
        this._onDestroyFns.push(fn);
    }
    play() {
        this._buildPlayer();
        if (!this.hasStarted()) {
            this._onStartFns.forEach(fn => fn());
            this._onStartFns = [];
            this._started = true;
            if (this._specialStyles) {
                this._specialStyles.start();
            }
        }
        this.domPlayer.play();
    }
    pause() {
        this.init();
        this.domPlayer.pause();
    }
    finish() {
        this.init();
        if (this._specialStyles) {
            this._specialStyles.finish();
        }
        this._onFinish();
        this.domPlayer.finish();
    }
    reset() {
        this._resetDomPlayerState();
        this._destroyed = false;
        this._finished = false;
        this._started = false;
        this._onStartFns = this._originalOnStartFns;
        this._onDoneFns = this._originalOnDoneFns;
    }
    _resetDomPlayerState() {
        if (this.domPlayer) {
            this.domPlayer.cancel();
        }
    }
    restart() {
        this.reset();
        this.play();
    }
    hasStarted() {
        return this._started;
    }
    destroy() {
        if (!this._destroyed) {
            this._destroyed = true;
            this._resetDomPlayerState();
            this._onFinish();
            if (this._specialStyles) {
                this._specialStyles.destroy();
            }
            this._onDestroyFns.forEach(fn => fn());
            this._onDestroyFns = [];
        }
    }
    setPosition(p) {
        if (this.domPlayer === undefined) {
            this.init();
        }
        this.domPlayer.currentTime = p * this.time;
    }
    getPosition() {
        // tsc is complaining with TS2362 without the conversion to number
        return +(this.domPlayer.currentTime ?? 0) / this.time;
    }
    get totalTime() {
        return this._delay + this._duration;
    }
    beforeDestroy() {
        const styles = new Map();
        if (this.hasStarted()) {
            // note: this code is invoked only when the `play` function was called prior to this
            // (thus `hasStarted` returns true), this implies that the code that initializes
            // `_finalKeyframe` has also been executed and the non-null assertion can be safely used here
            const finalKeyframe = this._finalKeyframe;
            finalKeyframe.forEach((val, prop) => {
                if (prop !== 'offset') {
                    styles.set(prop, this._finished ? val : computeStyle(this.element, prop));
                }
            });
        }
        this.currentSnapshot = styles;
    }
    /** @internal */
    triggerCallback(phaseName) {
        const methods = phaseName === 'start' ? this._onStartFns : this._onDoneFns;
        methods.forEach(fn => fn());
        methods.length = 0;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViX2FuaW1hdGlvbnNfcGxheWVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5pbWF0aW9ucy9icm93c2VyL3NyYy9yZW5kZXIvd2ViX2FuaW1hdGlvbnMvd2ViX2FuaW1hdGlvbnNfcGxheWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVNBLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFHeEMsTUFBTSxPQUFPLG1CQUFtQjtJQXlCOUIsWUFDVyxPQUFZLEVBQVMsU0FBK0IsRUFDcEQsT0FBdUMsRUFDdEMsY0FBd0M7UUFGekMsWUFBTyxHQUFQLE9BQU8sQ0FBSztRQUFTLGNBQVMsR0FBVCxTQUFTLENBQXNCO1FBQ3BELFlBQU8sR0FBUCxPQUFPLENBQWdDO1FBQ3RDLG1CQUFjLEdBQWQsY0FBYyxDQUEwQjtRQTNCNUMsZUFBVSxHQUFlLEVBQUUsQ0FBQztRQUM1QixnQkFBVyxHQUFlLEVBQUUsQ0FBQztRQUM3QixrQkFBYSxHQUFlLEVBQUUsQ0FBQztRQUcvQixpQkFBWSxHQUFHLEtBQUssQ0FBQztRQUNyQixjQUFTLEdBQUcsS0FBSyxDQUFDO1FBQ2xCLGFBQVEsR0FBRyxLQUFLLENBQUM7UUFDakIsZUFBVSxHQUFHLEtBQUssQ0FBQztRQUczQixxRkFBcUY7UUFDckYsc0VBQXNFO1FBQ3RFLDJFQUEyRTtRQUNuRSx1QkFBa0IsR0FBZSxFQUFFLENBQUM7UUFDcEMsd0JBQW1CLEdBQWUsRUFBRSxDQUFDO1FBSXRDLFNBQUksR0FBRyxDQUFDLENBQUM7UUFFVCxpQkFBWSxHQUF5QixJQUFJLENBQUM7UUFDMUMsb0JBQWUsR0FBa0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQU1oRCxJQUFJLENBQUMsU0FBUyxHQUFXLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM3QyxJQUFJLENBQUMsTUFBTSxHQUFXLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFB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WCxNQUFNLE1BQU0sR0FBa0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUN4QyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBRTtZQUNyQixvRkFBb0Y7WUFDcEYsZ0ZBQWdGO1lBQ2hGLDZGQUE2RjtZQUM3RixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsY0FBZSxDQUFDO1lBQzNDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUU7Z0JBQ2xDLElBQUksSUFBSSxLQUFLLFFBQVEsRUFBRTtvQkFDckIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2lCQUMzRTtZQUNILENBQUMsQ0FBQyxDQUFDO1NBQ0o7UUFFRCxJQUFJLENBQUMsZUFBZSxHQUFHLE1BQU0sQ0FBQztJQUNoQyxDQUFDO0lBRUQsZ0JBQWdCO0lBQ2hCLGVBQWUsQ0FBQyxTQUFpQjtRQUMvQixNQUFNLE9BQU8sR0FBRyxTQUFTLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQzNFLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzVCLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQ3JCLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtBbmltYXRpb25QbGF5ZXIsIMm1U3R5bGVEYXRhTWFwfSBmcm9tICdAYW5ndWxhci9hbmltYXRpb25zJztcblxuaW1wb3J0IHtjb21wdXRlU3R5bGV9IGZyb20gJy4uLy4uL3V0aWwnO1xuaW1wb3J0IHtTcGVjaWFsQ2FzZWRTdHlsZXN9IGZyb20gJy4uL3NwZWNpYWxfY2FzZWRfc3R5bGVzJztcblxuZXhwb3J0IGNsYXNzIFdlYkFuaW1hdGlvbnNQbGF5ZXIgaW1wbGVtZW50cyBBbmltYXRpb25QbGF5ZXIge1xuICBwcml2YXRlIF9vbkRvbmVGbnM6IEZ1bmN0aW9uW10gPSBbXTtcbiAgcHJpdmF0ZSBfb25TdGFydEZuczogRnVuY3Rpb25bXSA9IFtdO1xuICBwcml2YXRlIF9vbkRlc3Ryb3lGbnM6IEZ1bmN0aW9uW10gPSBbXTtcbiAgcHJpdmF0ZSBfZHVyYXRpb246IG51bWJlcjtcbiAgcHJpdmF0ZSBfZGVsYXk6IG51bWJlcjtcbiAgcHJpdmF0ZSBfaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfZmluaXNoZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfc3RhcnRlZCA9IGZhbHNlO1xuICBwcml2YXRlIF9kZXN0cm95ZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfZmluYWxLZXlmcmFtZT86IMm1U3R5bGVEYXRhTWFwO1xuXG4gIC8vIHRoZSBmb2xsb3dpbmcgb3JpZ2luYWwgZm5zIGFyZSBwZXJzaXN0ZW50IGNvcGllcyBvZiB0aGUgX29uU3RhcnRGbnMgYW5kIF9vbkRvbmVGbnNcbiAgLy8gYW5kIGFyZSB1c2VkIHRvIHJlc2V0IHRoZSBmbnMgdG8gdGhlaXIgb3JpZ2luYWwgdmFsdWVzIHVwb24gcmVzZXQoKVxuICAvLyAoc2luY2UgdGhlIF9vblN0YXJ0Rm5zIGFuZCBfb25Eb25lRm5zIGdldCBkZWxldGVkIGFmdGVyIHRoZXkgYXJlIGNhbGxlZClcbiAgcHJpdmF0ZSBfb3JpZ2luYWxPbkRvbmVGbnM6IEZ1bmN0aW9uW10gPSBbXTtcbiAgcHJpdmF0ZSBfb3JpZ2luYWxPblN0YXJ0Rm5zOiBGdW5jdGlvbltdID0gW107XG5cbiAgLy8gdXNpbmcgbm9uLW51bGwgYXNzZXJ0aW9uIGJlY2F1c2UgaXQncyByZShzZXQpIGJ5IGluaXQoKTtcbiAgcHVibGljIHJlYWRvbmx5IGRvbVBsYXllciE6IEFuaW1hdGlvbjtcbiAgcHVibGljIHRpbWUgPSAwO1xuXG4gIHB1YmxpYyBwYXJlbnRQbGF5ZXI6IEFuaW1hdGlvblBsYXllcnxudWxsID0gbnVsbDtcbiAgcHVibGljIGN1cnJlbnRTbmFwc2hvdDogybVTdHlsZURhdGFNYXAgPSBuZXcgTWFwKCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgZWxlbWVudDogYW55LCBwdWJsaWMga2V5ZnJhbWVzOiBBcnJheTzJtVN0eWxlRGF0YU1hcD4sXG4gICAgICBwdWJsaWMgb3B0aW9uczoge1trZXk6IHN0cmluZ106IHN0cmluZ3xudW1iZXJ9LFxuICAgICAgcHJpdmF0ZSBfc3BlY2lhbFN0eWxlcz86IFNwZWNpYWxDYXNlZFN0eWxlc3xudWxsKSB7XG4gICAgdGhpcy5fZHVyYXRpb24gPSA8bnVtYmVyPm9wdGlvbnNbJ2R1cmF0aW9uJ107XG4gICAgdGhpcy5fZGVsYXkgPSA8bnVtYmVyPm9wdGlvbnNbJ2RlbGF5J10gfHwgMDtcbiAgICB0aGlzLnRpbWUgPSB0aGlzLl9kdXJhdGlvbiArIHRoaXMuX2RlbGF5O1xuICB9XG5cbiAgcHJpdmF0ZSBfb25GaW5pc2goKSB7XG4gICAgaWYgKCF0aGlzLl9maW5pc2hlZCkge1xuICAgICAgdGhpcy5fZmluaXNoZWQgPSB0cnVlO1xuICAgICAgdGhpcy5fb25Eb25lRm5zLmZvckVhY2goZm4gPT4gZm4oKSk7XG4gICAgICB0aGlzLl9vbkRvbmVGbnMgPSBbXTtcbiAgICB9XG4gIH1cblxuICBpbml0KCk6IHZvaWQge1xuICAgIHRoaXMuX2J1aWxkUGxheWVyKCk7XG4gICAgdGhpcy5fcHJlcGFyZVBsYXllckJlZm9yZVN0YXJ0KCk7XG4gIH1cblxuICBwcml2YXRlIF9idWlsZFBsYXllcigpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5faW5pdGlhbGl6ZWQpIHJldHVybjtcbiAgICB0aGlzLl9pbml0aWFsaXplZCA9IHRydWU7XG5cbiAgICBjb25zdCBrZXlmcmFtZXMgPSB0aGlzLmtleWZyYW1lcztcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIG92ZXJ3cml0aW5nIGEgcmVhZG9ubHkgcHJvcGVydHlcbiAgICB0aGlzLmRvbVBsYXllciA9IHRoaXMuX3RyaWdnZXJXZWJBbmltYXRpb24odGhpcy5lbGVtZW50LCBrZXlmcmFtZXMsIHRoaXMub3B0aW9ucyk7XG4gICAgdGhpcy5fZmluYWxLZXlmcmFtZSA9IGtleWZyYW1lcy5sZW5ndGggPyBrZXlmcmFtZXNba2V5ZnJhbWVzLmxlbmd0aCAtIDFdIDogbmV3IE1hcCgpO1xuICAgIHRoaXMuZG9tUGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ2ZpbmlzaCcsICgpID0+IHRoaXMuX29uRmluaXNoKCkpO1xuICB9XG5cbiAgcHJpdmF0ZSBfcHJlcGFyZVBsYXllckJlZm9yZVN0YXJ0KCkge1xuICAgIC8vIHRoaXMgaXMgcmVxdWlyZWQgc28gdGhhdCB0aGUgcGxheWVyIGRvZXNuJ3Qgc3RhcnQgdG8gYW5pbWF0ZSByaWdodCBhd2F5XG4gICAgaWYgKHRoaXMuX2RlbGF5KSB7XG4gICAgICB0aGlzLl9yZXNldERvbVBsYXllclN0YXRlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZG9tUGxheWVyLnBhdXNlKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfY29udmVydEtleWZyYW1lc1RvT2JqZWN0KGtleWZyYW1lczogQXJyYXk8ybVTdHlsZURhdGFNYXA+KTogYW55W10ge1xuICAgIGNvbnN0IGtmczogYW55W10gPSBbXTtcbiAgICBrZXlmcmFtZXMuZm9yRWFjaChmcmFtZSA9PiB7XG4gICAgICBrZnMucHVzaChPYmplY3QuZnJvbUVudHJpZXMoZnJhbWUpKTtcbiAgICB9KTtcbiAgICByZXR1cm4ga2ZzO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfdHJpZ2dlcldlYkFuaW1hdGlvbihlbGVtZW50OiBIVE1MRWxlbWVudCwga2V5ZnJhbWVzOiBBcnJheTzJtVN0eWxlRGF0YU1hcD4sIG9wdGlvbnM6IGFueSk6XG4gICAgICBBbmltYXRpb24ge1xuICAgIHJldHVybiBlbGVtZW50LmFuaW1hdGUodGhpcy5fY29udmVydEtleWZyYW1lc1RvT2JqZWN0KGtleWZyYW1lcyksIG9wdGlvbnMpO1xuICB9XG5cbiAgb25TdGFydChmbjogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIHRoaXMuX29yaWdpbmFsT25TdGFydEZucy5wdXNoKGZuKTtcbiAgICB0aGlzLl9vblN0YXJ0Rm5zLnB1c2goZm4pO1xuICB9XG5cbiAgb25Eb25lKGZuOiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgdGhpcy5fb3JpZ2luYWxPbkRvbmVGbnMucHVzaChmbik7XG4gICAgdGhpcy5fb25Eb25lRm5zLnB1c2goZm4pO1xuICB9XG5cbiAgb25EZXN0cm95KGZuOiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgdGhpcy5fb25EZXN0cm95Rm5zLnB1c2goZm4pO1xuICB9XG5cbiAgcGxheSgpOiB2b2lkIHtcbiAgICB0aGlzLl9idWlsZFBsYXllcigpO1xuICAgIGlmICghdGhpcy5oYXNTdGFydGVkKCkpIHtcbiAgICAgIHRoaXMuX29uU3RhcnRGbnMuZm9yRWFjaChmbiA9PiBmbigpKTtcbiAgICAgIHRoaXMuX29uU3RhcnRGbnMgPSBbXTtcbiAgICAgIHRoaXMuX3N0YXJ0ZWQgPSB0cnVlO1xuICAgICAgaWYgKHRoaXMuX3NwZWNpYWxTdHlsZXMpIHtcbiAgICAgICAgdGhpcy5fc3BlY2lhbFN0eWxlcy5zdGFydCgpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmRvbVBsYXllci5wbGF5KCk7XG4gIH1cblxuICBwYXVzZSgpOiB2b2lkIHtcbiAgICB0aGlzLmluaXQoKTtcbiAgICB0aGlzLmRvbVBsYXllci5wYXVzZSgpO1xuICB9XG5cbiAgZmluaXNoKCk6IHZvaWQge1xuICAgIHRoaXMuaW5pdCgpO1xuICAgIGlmICh0aGlzLl9zcGVjaWFsU3R5bGVzKSB7XG4gICAgICB0aGlzLl9zcGVjaWFsU3R5bGVzLmZpbmlzaCgpO1xuICAgIH1cbiAgICB0aGlzLl9vbkZpbmlzaCgpO1xuICAgIHRoaXMuZG9tUGxheWVyLmZpbmlzaCgpO1xuICB9XG5cbiAgcmVzZXQoKTogdm9pZCB7XG4gICAgdGhpcy5fcmVzZXREb21QbGF5ZXJTdGF0ZSgpO1xuICAgIHRoaXMuX2Rlc3Ryb3llZCA9IGZhbHNlO1xuICAgIHRoaXMuX2ZpbmlzaGVkID0gZmFsc2U7XG4gICAgdGhpcy5fc3RhcnRlZCA9IGZhbHNlO1xuICAgIHRoaXMuX29uU3RhcnRGbnMgPSB0aGlzLl9vcmlnaW5hbE9uU3RhcnRGbnM7XG4gICAgdGhpcy5fb25Eb25lRm5zID0gdGhpcy5fb3JpZ2luYWxPbkRvbmVGbnM7XG4gIH1cblxuICBwcml2YXRlIF9yZXNldERvbVBsYXllclN0YXRlKCkge1xuICAgIGlmICh0aGlzLmRvbVBsYXllcikge1xuICAgICAgdGhpcy5kb21QbGF5ZXIuY2FuY2VsKCk7XG4gICAgfVxuICB9XG5cbiAgcmVzdGFydCgpOiB2b2lkIHtcbiAgICB0aGlzLnJlc2V0KCk7XG4gICAgdGhpcy5wbGF5KCk7XG4gIH1cblxuICBoYXNTdGFydGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9zdGFydGVkO1xuICB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX2Rlc3Ryb3llZCkge1xuICAgICAgdGhpcy5fZGVzdHJveWVkID0gdHJ1ZTtcbiAgICAgIHRoaXMuX3Jlc2V0RG9tUGxheWVyU3RhdGUoKTtcbiAgICAgIHRoaXMuX29uRmluaXNoKCk7XG4gICAgICBpZiAodGhpcy5fc3BlY2lhbFN0eWxlcykge1xuICAgICAgICB0aGlzLl9zcGVjaWFsU3R5bGVzLmRlc3Ryb3koKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX29uRGVzdHJveUZucy5mb3JFYWNoKGZuID0+IGZuKCkpO1xuICAgICAgdGhpcy5fb25EZXN0cm95Rm5zID0gW107XG4gICAgfVxuICB9XG5cbiAgc2V0UG9zaXRpb24ocDogbnVtYmVyKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuZG9tUGxheWVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuaW5pdCgpO1xuICAgIH1cbiAgICB0aGlzLmRvbVBsYXllci5jdXJyZW50VGltZSA9IHAgKiB0aGlzLnRpbWU7XG4gIH1cblxuICBnZXRQb3NpdGlvbigpOiBudW1iZXIge1xuICAgIC8vIHRzYyBpcyBjb21wbGFpbmluZyB3aXRoIFRTMjM2MiB3aXRob3V0IHRoZSBjb252ZXJzaW9uIHRvIG51bWJlclxuICAgIHJldHVybiArKHRoaXMuZG9tUGxheWVyLmN1cnJlbnRUaW1lID8/IDApIC8gdGhpcy50aW1lO1xuICB9XG5cbiAgZ2V0IHRvdGFsVGltZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9kZWxheSArIHRoaXMuX2R1cmF0aW9uO1xuICB9XG5cbiAgYmVmb3JlRGVzdHJveSgpIHtcbiAgICBjb25zdCBzdHlsZXM6IMm1U3R5bGVEYXRhTWFwID0gbmV3IE1hcCgpO1xuICAgIGlmICh0aGlzLmhhc1N0YXJ0ZWQoKSkge1xuICAgICAgLy8gbm90ZTogdGhpcyBjb2RlIGlzIGludm9rZWQgb25seSB3aGVuIHRoZSBgcGxheWAgZnVuY3Rpb24gd2FzIGNhbGxlZCBwcmlvciB0byB0aGlzXG4gICAgICAvLyAodGh1cyBgaGFzU3RhcnRlZGAgcmV0dXJucyB0cnVlKSwgdGhpcyBpbXBsaWVzIHRoYXQgdGhlIGNvZGUgdGhhdCBpbml0aWFsaXplc1xuICAgICAgLy8gYF9maW5hbEtleWZyYW1lYCBoYXMgYWxzbyBiZWVuIGV4ZWN1dGVkIGFuZCB0aGUgbm9uLW51bGwgYXNzZXJ0aW9uIGNhbiBiZSBzYWZlbHkgdXNlZCBoZXJlXG4gICAgICBjb25zdCBmaW5hbEtleWZyYW1lID0gdGhpcy5fZmluYWxLZXlmcmFtZSE7XG4gICAgICBmaW5hbEtleWZyYW1lLmZvckVhY2goKHZhbCwgcHJvcCkgPT4ge1xuICAgICAgICBpZiAocHJvcCAhPT0gJ29mZnNldCcpIHtcbiAgICAgICAgICBzdHlsZXMuc2V0KHByb3AsIHRoaXMuX2ZpbmlzaGVkID8gdmFsIDogY29tcHV0ZVN0eWxlKHRoaXMuZWxlbWVudCwgcHJvcCkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLmN1cnJlbnRTbmFwc2hvdCA9IHN0eWxlcztcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgdHJpZ2dlckNhbGxiYWNrKHBoYXNlTmFtZTogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgbWV0aG9kcyA9IHBoYXNlTmFtZSA9PT0gJ3N0YXJ0JyA/IHRoaXMuX29uU3RhcnRGbnMgOiB0aGlzLl9vbkRvbmVGbnM7XG4gICAgbWV0aG9kcy5mb3JFYWNoKGZuID0+IGZuKCkpO1xuICAgIG1ldGhvZHMubGVuZ3RoID0gMDtcbiAgfVxufVxuIl19