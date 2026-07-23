import Shepherd from 'shepherd.js'
import Experience from './experience'

const defaultLanguage = 'en'
const tutorialCopy = {
  zh: {
    skip: '跳过',
    back: '上一步',
    next: '下一步',
    yes: '养过，我会玩',
    no: '没有，请教我',
    gotIt: '知道了',
    understood: '明白了',
    ready: '开始学习',
    continue: '继续',
    whatsNext: '下一步',
    clear: '清楚了',
    soundsGood: '好的',
    timeToGo: '开始',
    done: '完成',
    welcomeTitle: '你好',
    welcomeText: '是否养过电子宠物？',
    buttonATitle: 'A 键',
    buttonAText: '按下它可以在菜单图标和选项之间移动。',
    buttonBTitle: 'B 键',
    buttonBText: '按下它可以确认选择、和宠物互动，并执行当前操作。',
    buttonCTitle: 'C 键',
    buttonCText: '按下它可以返回、取消选择或关闭菜单。',
    screenTitle: '屏幕',
    screenText: '你的宠物会在这里生活、吃饭、睡觉和玩耍。接下来学习各项操作。',
    screenTopText: `<ul>
          <li><strong>喂食</strong> - 宠物饿了可以喂正餐，不开心时可以给点心。</li>
          <li><strong>灯光</strong> - 宠物睡觉时关灯，醒来后再开灯。</li>
          <li><strong>游戏</strong> - 陪宠物玩耍，让它保持健康和开心。</li>
          <li><strong>药品</strong> - 宠物生病时使用药品帮助恢复。</li>
        </ul>`,
    screenBottomText: `<ul>
          <li><strong>清洁</strong> - 宠物弄脏后及时清理，不要堆积。</li>
          <li><strong>状态</strong> - 查看宠物当前状态，随时关注各项数值。</li>
          <li><strong>纪律</strong> - 宠物无故求关注或拒绝需求时，可以进行训练。</li>
          <li><strong>提醒</strong> - 图标亮起时，表示宠物需要照顾。</li>
        </ul>`,
    resetTitle: '重置',
    resetText: '一切都会结束。宠物离开时，或想重新开始时，可以按下重置键。',
    customizationTitle: '外观',
    customizationText: '可以更改外壳和边框颜色，让设备更符合你的喜好。',
    soundsTitle: '声音',
    soundsText: touch => `可以随时开启或关闭音效和音乐。${touch ? '<br/>设备静音模式会被保留。' : ''}`,
    timeSpeedTitle: '时间速度',
    timeSpeedText: '可以调整时间流逝速度，在三档节奏中选择适合你的玩法。',
    tabTitle: '准备好了',
    tabText: '拉出电池绝缘片即可开机，你的电子宠物会开始生活。',
  },
  en: {
    skip: 'Skip',
    back: 'Back',
    next: 'Next',
    yes: 'I have raised one',
    no: 'Teach me',
    gotIt: 'Got it',
    understood: 'Understood',
    ready: 'I am ready',
    continue: 'Continue',
    whatsNext: 'What is next',
    clear: 'It is clear',
    soundsGood: 'Sounds good',
    timeToGo: 'Time to go',
    done: 'Done',
    welcomeTitle: 'Hello',
    welcomeText: 'Have you raised a virtual pet before?',
    buttonATitle: 'A Button',
    buttonAText: 'Press it to move between menu icons and options.',
    buttonBTitle: 'B Button',
    buttonBText: 'Press it to confirm selections, interact with your pet, and run the current action.',
    buttonCTitle: 'C Button',
    buttonCText: 'Press it to go back, cancel a selection, or close menus.',
    screenTitle: 'Screen',
    screenText: 'This is where your pet lives, eats, sleeps, and plays. Next, learn the actions.',
    screenTopText: `<ul>
          <li><strong>Feed</strong> - Give meals when your pet is hungry, or snacks when it is unhappy.</li>
          <li><strong>Light</strong> - Turn the light off when it sleeps and back on when it wakes.</li>
          <li><strong>Play</strong> - Keep your pet entertained for a healthy life.</li>
          <li><strong>Medicine</strong> - Use medicine when your pet gets sick.</li>
        </ul>`,
    screenBottomText: `<ul>
          <li><strong>Clean</strong> - Clean messes before they pile up.</li>
          <li><strong>Meter</strong> - Check how your pet is doing and watch the stats.</li>
          <li><strong>Discipline</strong> - Train your pet when it misbehaves or calls for no reason.</li>
          <li><strong>Attention</strong> - When this icon lights up, your pet needs care.</li>
        </ul>`,
    resetTitle: 'Reset',
    resetText: 'Everything ends eventually. If your pet passes away or you want a fresh start, press reset.',
    customizationTitle: 'Customization',
    customizationText: 'Change the frame and shell colors to make the device yours.',
    soundsTitle: 'Sounds',
    soundsText: touch => `Turn sounds and music on or off whenever you like.${touch ? '<br/>Your device silent mode is respected.' : ''}`,
    timeSpeedTitle: 'Time Speed',
    timeSpeedText: 'Adjust how fast time passes and choose one of three pace settings.',
    tabTitle: 'Ready',
    tabText: 'Pull the battery strip to turn on the device and your virtual pet will come to life.',
  },
}

function getTutorialLanguage() {
  const params = new URLSearchParams(window.location.search)
  return params.get('lang') === 'zh' ? 'zh' : defaultLanguage
}

export default class Tutorial {
  constructor() {
    this.experience = Experience.instance
    this.sizes = this.experience.sizes
    this.camera = this.experience.camera
    this.device = this.experience.device
    this.screen = this.experience.screen
    this.pointer = this.experience.pointer
    this.ui = this.experience.ui
    this.language = getTutorialLanguage()
    this.copy = tutorialCopy[this.language]

    this.overlay = document.querySelector('.tutorial-overlay')
    this.spotlight = document.querySelector('.tutorial-spotlight')
    this.completed = JSON.parse(localStorage.getItem('tutorial-completed'))

    this.setTutorialButton()

    window.controls = this.camera.controls

    this.tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        arrow: false,
        classes: 'tutorial-step',
        attachTo: {
          element: '.webgl',
          on: 'bottom',
        },
        when: {
          show() {
            const currentStep = this.tour.getCurrentStep()
            const currentStepElement = currentStep?.getElement()
            const header = currentStepElement?.querySelector('.shepherd-header')
            if (header) {
              const progress = document.createElement('span')
              progress.innerText = `${this.tour.steps.indexOf(currentStep) + 1}/${this.tour.steps.length}`
              header.append(progress)
            }
          },
        },
      },
    })

    const skipButton = {
      text: this.copy.skip,
      secondary: true,
      action: this.tour.cancel,
    }

    const backButton = {
      text: this.copy.back,
      secondary: true,
      action: this.tour.back,
    }

    const nextButton = (text = this.copy.next) => ({
      text,
      action: this.tour.next,
    })

    this.tour.addSteps([
      {
        id: 'welcome',
        classes: 'ignore',
        title: this.copy.welcomeTitle,
        text: this.copy.welcomeText,
        attachTo: undefined,
        buttons: [
          {
            text: this.copy.yes,
            secondary: true,
            action: () => (this.device.tab ? this.tour.show('tab') : this.tour.complete()),
          },
          nextButton(this.copy.no),
        ],
      },
      {
        id: 'button-a',
        title: `${this.copy.buttonATitle}${this.pointer.isTouchDevice ? '' : '<img src="images/keys/tab.png"/>'}`,
        text: this.copy.buttonAText,
        buttons: [skipButton, backButton, nextButton(this.copy.gotIt)],
      },
      {
        id: 'button-b',
        title: `${this.copy.buttonBTitle}${this.pointer.isTouchDevice ? '' : '<div><img src="images/keys/spacebar.png"/><img class="ml-2" src="images/keys/return.png"/></div>'}`,
        text: this.copy.buttonBText,
        buttons: [skipButton, backButton, nextButton(this.copy.understood)],
      },
      {
        id: 'button-c',
        title: `${this.copy.buttonCTitle}${this.pointer.isTouchDevice ? '' : '<img src="images/keys/backspace.png"/>'}`,
        text: this.copy.buttonCText,
        buttons: [skipButton, backButton, nextButton(this.copy.gotIt)],
      },
      {
        id: 'screen',
        title: this.copy.screenTitle,
        text: this.copy.screenText,
        buttons: [skipButton, backButton, nextButton(this.copy.ready)],
      },

      {
        id: 'screen-top',
        classes: 'small',
        text: this.copy.screenTopText,
        buttons: [skipButton, backButton, nextButton()],
      },
      {
        id: 'screen-bottom',
        classes: 'small',
        text: this.copy.screenBottomText,
        buttons: [skipButton, backButton, nextButton(this.copy.continue)],
      },
      {
        id: 'button-reset',
        title: this.copy.resetTitle,
        text: this.copy.resetText,
        buttons: [skipButton, backButton, nextButton(this.copy.whatsNext)],
      },
      {
        id: 'customization',
        title: this.copy.customizationTitle,
        text: this.copy.customizationText,
        classes: 'ignore',
        attachTo: {
          element: '#colors',
          on: 'top',
        },
        buttons: [skipButton, backButton, nextButton(this.copy.clear)],
      },
      {
        id: 'sounds',
        title: `${this.copy.soundsTitle}${this.pointer.isTouchDevice ? '' : '<div><img src="images/keys/m.png"/><img src="images/keys/b.png"/></div>'}`,
        text: this.copy.soundsText(this.pointer.isTouchDevice),
        classes: 'ignore',
        attachTo: {
          element: '#sounds',
          on: 'top',
        },
        buttons: [skipButton, backButton, nextButton(this.copy.soundsGood)],
      },
      {
        id: 'time-speed',
        title: `${this.copy.timeSpeedTitle}${this.pointer.isTouchDevice ? '' : '<div><img src="images/keys/1.png"/><img src="images/keys/2.png"/><img src="images/keys/3.png"/></div>'}`,
        text: this.copy.timeSpeedText,
        classes: 'ignore',
        attachTo: {
          element: '#speed-settings',
          on: 'top',
        },
        buttons: [skipButton, backButton, nextButton(this.copy.timeToGo)],
      },
    ])

    if (this.device.tab) {
      this.tour.addStep({
        id: 'tab',
        title: this.copy.tabTitle,
        text: this.copy.tabText,
        buttons: [nextButton(this.copy.done)],
      })
    }

    this.tour.on('complete', async () => {
      if (this.lastTransition) {
        await this.lastTransition
      }
      this.end()
    })

    this.tour.on('cancel', () =>
      this.device.tab && this.tour.currentStep.id !== 'tab'
        ? this.tour.show('tab')
        : this.tour.complete(),
    )

    this.tour.on('show', async step => {
      if (this.lastTransition) {
        await this.lastTransition
      }

      this.lastTransition = this.animateCamera(step)
    })
  }

  toggleOverlay() {
    this.overlay.classList.toggle('flex')
    this.overlay.classList.toggle('hidden')
  }

  hideSpotlight() {
    this.spotlight.style.width = this.spotlight.style.height = '2000px'
  }

  setSpotlight(dimension) {
    this.spotlight.style.width = this.spotlight.style.height =
      dimension === 'lg' ? `80svh` : dimension === 'md' ? '50svh' : '30svh'
  }

  start = () => {
    if (this.tour.isActive()) return

    this.camera.controls.enabled = false
    if (this.device.colorPicker.visible) this.device.colorPicker.toggle()

    this.tour.start()
    this.toggleOverlay()
  }

  end = async () => {
    this.hideSpotlight()
    setTimeout(() => this.toggleOverlay(), 1000)

    this.camera.intro()

    localStorage.setItem('tutorial-completed', 'true')
  }

  setTutorialButton() {
    this.button = document.getElementById('tutorial')
    this.button.onclick = this.start
  }

  animateCamera = async ({ step }) => {
    this.camera.controls.smoothTime = 0.5

    const iconsXStart = -0.245
    const iconsXEnd = iconsXStart + 0.17 * 3
    const iconsYTop = 0.2
    const iconsYBottom = -0.4

    const tabX = 1
    const tabY = -0.2

    switch (step.id) {
      case 'welcome':
        this.hideSpotlight()
        this.camera.intro(0.5)
        break

      case 'button-a':
        this.setSpotlight('sm')
        this.camera.controls.fitToBox(this.device.buttonSlots.at(0).mesh, true)
        break
      case 'button-b':
        this.camera.controls.fitToBox(this.device.buttonSlots.at(1).mesh, true)
        break
      case 'button-c':
        this.setSpotlight('sm')
        this.camera.controls.zoomTo(1, true)
        this.camera.controls.fitToBox(this.device.buttonSlots.at(2).mesh, true)
        break

      case 'screen':
        this.setSpotlight(this.sizes.aspectRatio < 1 ? 'md' : 'lg')
        this.camera.controls.zoomTo(this.sizes.aspectRatio < 1 ? 0.6 : 1, true)
        this.camera.controls.fitToBox(this.screen.mesh, true, { cover: true })
        break

      case 'screen-top':
        this.hideSpotlight()
        this.camera.controls.zoomTo(1.5, true)
        await this.camera.controls.moveTo(iconsXStart, iconsYTop, 0, true)
        this.camera.controls.smoothTime = 2
        this.camera.controls.moveTo(iconsXEnd, iconsYTop, 0, true)
        break
      case 'screen-bottom':
        this.hideSpotlight()
        this.camera.controls.zoomTo(1.5, true)
        this.camera.controls.rotateAzimuthTo(0, true)
        await this.camera.controls.moveTo(iconsXStart, iconsYBottom, 0, true)
        this.camera.controls.smoothTime = 2
        this.camera.controls.moveTo(iconsXEnd, iconsYBottom, 0, true)
        break

      case 'button-reset':
        this.camera.controls.zoomTo(1, true)
        this.camera.controls.rotateAzimuthTo(Math.PI, true)
        this.setSpotlight('sm')
        this.camera.controls.fitToBox(this.device.buttonSlots.at(3).mesh, true)
        break

      case 'customization':
      case 'sounds':
      case 'time-speed':
        this.hideSpotlight()
        this.camera.intro(0.5)
        break

      case 'tab':
        this.setSpotlight(this.sizes.aspectRatio < 1 ? 'md' : 'lg')
        this.camera.controls.zoomTo(1, true)
        this.camera.controls.fitToBox(this.device.tab.mesh, true)
        this.camera.controls.moveTo(tabX, tabY, 0, true)
        this.camera.controls.rotateAzimuthTo(Math.PI * 0.25, true)
        break
    }
  }
}
