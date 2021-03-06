import Vector2 from 'phaser/src/math/Vector2'



export class PlayerWithGun extends Phaser.GameObjects.Container {
    constructor(scene, x, y, characterSpriteName, gunSpriteName) {
        super(scene, x, y)
        this.setSize(31, 31);
        scene.physics.world.enable(this);
        this.body.setCollideWorldBounds(true);
        scene.add.existing(this);
        this.hp = 100
        this.kushCount = 0

        this.character = scene.characterFactory.buildCharacter(characterSpriteName, 0, 0, {player: true});
        this.gun = new Phaser.GameObjects.Sprite(scene, 2, 8, gunSpriteName);

        this.add(this.character)
        this.add(this.gun)

        this.setViewDirectionAngle(0)

        this.behaviuors = [];
        this.steerings = [];

        this.radius = 100;
        this.groupId = 0;

        this.lastTimeFired = 0;

        scene.input.on('pointermove', pointer => this._onPointerMove(pointer, scene));
    }

    damage(){
        this.hp = this.hp -10
    }

    get isFiring() {
        const now = (new Date()).getTime();
        return (now - this.lastTimeFired) < 1000;
    }

    _onPointerMove(pointer, scene) {
        // console.log("set angle")
        // console.log("this", {x: this.x, y: this.y})
        // console.log("gun", { x: this.gun.x, y :this.gun.y});
        // console.log("pointer", { x: pointer.x, y : pointer.y});

        this.setViewDirectionAngle(
            Phaser.Math.Angle.Between(
                this.x + this.gun.x,
                this.y + this.gun.y,
                pointer.x + scene.cameras.main.scrollX,
                pointer.y + scene.cameras.main.scrollY
            )
        )
    }

    addBehaviour(behaviour) {
        behaviour.character = this;
        this.behaviuors.push(behaviour);
    }

    update() {
        this.behaviuors.forEach(x => x.update());
        this.updateAnimation();
    };

    subtractHP(value) {
        this.hp -= value;
        this.scene.events.emit('changeHP');
    }

    addHP(value) {
        this.hp += value;
        this.scene.events.emit('changeHP');
    }

    get bulletStartingPoint() {

        const angle = this.viewDirectionAngle
        const approxGunWidth = this.gun.width - 2
        const x = this.gun.x + (approxGunWidth * Math.cos(angle));
        const y = this.gun.y + (approxGunWidth * Math.sin(angle));
        return new Vector2(this.x + x, this.y + y)
    }

    setViewDirectionAngle(newAngle) {
        // console.log("new angle", newAngle)
        this.viewDirectionAngle = newAngle

        if(newAngle > 1.56 || newAngle < -1.56) {
            this.gun.setFlip(false, true)
            this.gun.setOrigin(0.4, 0.6)
            this.gun.x = -6
        } else {
            this.gun.setFlip(false, false)
            this.gun.setOrigin(0.4, 0.4)
            this.gun.x = 6
        }
        this.gun.setRotation(newAngle)
    }

    updateAnimation() {
        // TODO: Fix the gun
        // Now it's not making a full circle as expected, it gets stuck
        // Some rare time it magically works, but I have no idea why
        try {

            const animations = this.animationSets.get('Walk');
            const animsController = this.character.anims;
            const angle = this.viewDirectionAngle

            if (angle < 0.78 && angle > -0.78) {
                this.gun.y = 8
                this.bringToTop(this.gun)
                animsController.play(animations[1], true);
            } else if (angle < 2.35 && angle > 0.78) {
                this.gun.y = 8
                this.bringToTop(this.gun)
                animsController.play(animations[3], true);
            } else if (angle < -2.35 || angle > 2.35) {
                this.gun.y = 8
                this.bringToTop(this.gun)
                animsController.play(animations[0], true);
            } else if (angle > -2.35 && angle < -0.78) {
                this.gun.y = -4
                this.bringToTop(this.character)
                animsController.play(animations[2], true);
            } else {
                const currentAnimation = animsController.currentAnim;
                if (currentAnimation) {
                    const frame = currentAnimation.getLastFrame();
                    this.character.setTexture(frame.textureKey, frame.textureFrame);
                }
            }
        } catch (e) {
            console.error('[PlayerWithGun] updateAnimation failed')
        }
    }
}


