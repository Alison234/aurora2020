import Vector2 from "phaser/src/math/Vector2";

export default class NpcWithGun extends Phaser.GameObjects.Container {
    constructor(scene, x, y, characterSpriteName, gunSpriteName, initialState) {
        super(scene, x, y);
        //console.log("scene", this.scene)

        this.setSize(31, 31);
        scene.physics.world.enable(this);
        this.body.setCollideWorldBounds(true);
        scene.add.existing(this);

        this.character = scene.characterFactory.buildCharacter(characterSpriteName, 0, 0);
        this.gun = new Phaser.GameObjects.Sprite(scene, 2, 8, gunSpriteName);

        this.add(this.character)
        this.add(this.gun)

        this.hp = 50;
        this.radius = 100;
        this.groupId = 1;

        this.lastTimeFired = 0;

        this.maxSpeed = 50;
        this.state = initialState;

        this.lastTimeAttacked = 0;
        this.attackDelay = 1000;

        this.target = null;

        // states and steerings are set by parameters in character-factory
        this.stateTable = [];
        this.steerings = [];
    }

    get isDead() {
        return this.hp <= 0;
    }

    get isFiring() {
        const now = (new Date()).getTime();
        return (now - this.lastTimeFired) < getRandomIntInclusive(500,1000);
    }

    setAngleToTarget(target) {
        this.setViewDirectionAngle(
            Phaser.Math.Angle.Between(
                this.x + this.gun.x,
                this.y + this.gun.y,
                target.x,
                target.y
            )
        )
    }

    setViewDirectionAngle(newAngle) {
        // console.log("new angle", newAngle)
        this.viewDirectionAngle = newAngle

        if (newAngle > 1.56 || newAngle < -1.56) {
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

    get bulletStartingPoint() {
        const angle = this.viewDirectionAngle
        const approxGunWidth = this.gun.width - 2
        const x = this.gun.x + (approxGunWidth * Math.cos(angle));
        const y = this.gun.y + (approxGunWidth * Math.sin(angle));
        return new Vector2(this.x + x, this.y + y)
    }

    updateVelocity() {
        const dir = this.steerings[this.state].calculateImpulse();
        this.body.setVelocityX(dir.x);
        this.body.setVelocityY(dir.y);
    }

    update() {
        if (this.hp > 0) {
            const nextState = this.stateTable.getNextState(this.state);
            this.state = nextState;
            if (this.target && this.target.isDead) {
                this.target = null;
            }
            if (this.target) {
                this.setAngleToTarget(this.target);
            }
            this.updateVelocity();
            this.updateAnimation();
        }else{
                this.updateAnimation();
                this.body.setVelocityX(0)
                this.body.setVelocityY(0)
        }
    }

    updateAnimation() {
        try {
            if(this.hp > 0) {
                const animations = this.animationSets.get('WalkWithGun');
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
            }else{
                    const animations = this.animationSets.get("Dead")
                    const animsController = this.character.anims;
                    animsController.play(animations[0], true);
            }
        }
        catch (e) {
            console.error('[NpcWithStates] updateAnimation failed')
        }
    }

    subtractHP(value) {
        this.hp -= value;
        this.scene.events.emit('changeHP');
    }

    addHP(value) {
        this.hp += value;
        this.scene.events.emit('changeHP');
    }

    get canAttack() {
        const now = (new Date()).getTime();
        return this.lastTimeAttacked === 0 || (now - this.lastTimeAttacked) > this.attackDelay;
    }

    attack(target) {
        if (this.canAttack) {
            // debugger
            this.lastTimeAttacked = (new Date()).getTime();
            this.setAngleToTarget(target);

            const {x, y} = this.bulletStartingPoint;
            const vx = target.x - x;
            const vy = target.y - y;

            const BULLET_SPEED = 200
            const mult = BULLET_SPEED / Math.sqrt(vx*vx + vy*vy)
            this.scene.bullets.fireBullet(x, y, vx * mult, vy * mult);
        }
    }
    damage(scene)
    {
        if (this.hp > 0)
            this.hp = this.hp - 10

    }
}

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.round(Math.random() * (max - min ) + min);
}