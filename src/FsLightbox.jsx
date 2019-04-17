import React, { Component } from 'react';
import PropTypes from 'prop-types';
import "./scss/FsLightbox.scss";
import Nav from "./components/nav/Nav.jsx";
import SlideButtonLeft from "./components/slide-buttons/SlideButtonLeft.jsx";
import SlideButtonRight from "./components/slide-buttons/SlideButtonRight.jsx";
import SourcesHoldersWrapper from "./components/sources/SourcesHoldersWrapper.jsx";
import { createRefsArrayForNumberOfSlides } from "./helpers/arrays/createRefsArrayForNumberOfSlides";
import { createNullArrayForNumberOfSlides } from "./helpers/arrays/createNullArrayForNumberOfSlides";
import { Core } from "./core/Core";
import DownEventDetector from "./components/slide-swiping/DownEventDetector.jsx";
import SwipingInvisibleHover from "./components/slide-swiping/SwipingInvisibleHover.jsx";
import { StageSourceHoldersByValueTransformer } from "./core/transforms/stage-source-holders-transformers/StageSourceHoldersByValueTransformer";
import { SourceHolderTransformer } from "./core/transforms/SourceHolderTransformer";
import { SlideSwipingMoveActions } from "./core/slide-swiping/actions/move/SlideSwipingMoveActions";
import { SlideSwipingUpActions } from "./core/slide-swiping/actions/up/SlideSwipingUpActions";
import { SwipingTransitioner } from "./core/slide-swiping/actions/up/SwipingTransitioner";
import { SwipingSlideChanger } from "./core/slide-swiping/actions/up/SwipingSlideChanger";
import { SourceCreator } from "./core/sources/SourceCreator";
import { SourceTypeGetter } from "./core/sources/creating/SourceTypeGetter";
import { SourceSizeAdjusterIterator } from "./core/sizes/SourceSizeAdjusterIterator";
import { RefactoredSourceComponentGetter } from "./core/sources/creating/RefactoredSourceComponentGetter";
import { SourcesFactory } from "./core/sources/creating/SourcesFactory";

class FsLightbox extends Component {
    constructor(props) {
        super(props);
        this.setUpData();
        this.setUpSourcesData();
        this.setUpStates();
        this.setUpGetters();
        this.setUpSetters();
        this.setUpElements();
        this.setUpCollections();
        this.setUpInjector();
        this.setUpCore();
        new SourcesFactory(this).createSourcesAndAddThemToProperArrays();
    }

    setUpData() {
        /**
         * @type {{isToolbarCoreInitialized: boolean, deviceType: number, urls: Array, totalSlides: number, isInitialized: boolean, isSwipingSlides: boolean}}
         */
        this.data = {
            urls: this.props.urls,
            totalSlides: this.props.urls.length,
            isToolbarCoreInitialized: false,
            isInitialized: false,
            isSwipingSlides: false,
        };
    }

    setUpSourcesData() {
        /**
         * @type {{slideDistance: *, sourcesTypes: Array, maxSourceHeight: number, isSourceHolderMountedArray: Array, isSourceAlreadyInitializedArray: Array, videosPosters: Array, maxSourceWidth: number, sourcesToCreateOnConstruct: Array, sourcesDimensions: Array}}
         */
        this.sourcesData = {
            sourcesTypes: [],
            isSourceAlreadyInitializedArray: [],
            // if lightbox will be closed during source type check we need call create source after next open
            sourcesToCreateOnConstruct: [],
            videosPosters: (this.props.videosPosters) ? this.props.videosPosters : [],
            maxSourceWidth: 0,
            maxSourceHeight: 0,
            slideDistance: (this.props.slideDistance) ? this.props.slideDistance : 1.3,
            sourcesDimensions: [],
        };
    }

    setUpStates() {
        this.state = {
            isOpen: this.props.isOpen,
        };

        // to objects are assigned in correct components two methods:
        // - get()
        // - set(value)
        // And (only if it is used, by default not) property:
        // - onUpdate - after setting it to method it will be called once component updates
        // (its called only one time - after first call its deleted)
        this.componentsStates = {
            slide: {},
            isSwipingSlides: {},
            isFullscreenOpen: {},
            sourcesComponents: {},
            shouldSourceHolderBeUpdatedCollection: [],
        };
    }

    setUpGetters() {
        this.getters = {
            getIsOpen: () => this.state.isOpen,
            initialize: () => this.initialize(),
        };
    }

    setUpSetters() {
        this.setters = {
            setState: (value, callback) => this.setState(value, callback),
        }
    }

    setUpElements() {
        this.elements = {
            container: React.createRef(),
            sourcesHoldersWrapper: React.createRef(),
            sources: createRefsArrayForNumberOfSlides(this.data.totalSlides),
            sourceHolders: createRefsArrayForNumberOfSlides(this.data.totalSlides),
            sourcesJSXComponents: createNullArrayForNumberOfSlides(this.data.totalSlides),
            sourcesComponents: [],
            createdButNotRenderedSourcesComponents: [],
        };
    }

    setUpCollections() {
        this.collections = {
            // after source load its size adjuster will be stored in this array so SourceSizeAdjusterIterator may use it
            sourceSizeAdjusters: [],
            properSourcesControllers: [],
            xhrs: []
        }
    }

    setUpInjector() {
        this.injector = {
            sizes: {
                getSourceSizeAdjusterIterator: () => new SourceSizeAdjusterIterator(this)
            },
            slideSwiping: {
                getMoveActionsForSwipingProps: (swipingProps) => new SlideSwipingMoveActions(this, swipingProps),
                getUpActionsForSwipingProps: (swipingProps) => new SlideSwipingUpActions(this, swipingProps),
                getSwipingTransitioner: () => new SwipingTransitioner(this),
                getSwipingSlideChangerForSwipingTransitioner: (swipingTransitioner) => new SwipingSlideChanger(this, swipingTransitioner),
            },
            source: {
                getSourceComponentGetter: () => new RefactoredSourceComponentGetter(this),
                getSourceTypeGetter: () => new SourceTypeGetter(this),
                getSourceCreator: () => new SourceCreator()
            },
            transforms: {
                getSourceHolderTransformer: () => new SourceHolderTransformer(this),
                getStageSourceHoldersByValueTransformer: () => new StageSourceHoldersByValueTransformer(this),
                getInitialStageSourceHoldersByValueTransformer: () => ({ stageSourcesIndexes: {} })
            }
        };
    }

    setUpCore() {
        this.core = new Core(this);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.isOpen !== this.props.isOpen) {
            (this.state.isOpen) ?
                this.core.closeOpenLightbox.closeLightbox() :
                this.core.closeOpenLightbox.openLightbox();
        }
        if (prevProps.slide !== this.props.slide) {
            this.core.slideChanger.changeSlideTo(this.props.slide);
        }
    }

    initialize() {
        this.data.isInitialized = true;
        this.core.globalResizingController.saveMaxSourcesDimensionsAndAdjustSourcesWrapperSize();
        this.core.eventsControllers.window.resize.attachListener();
        this.core.eventsControllers.window.swiping.attachListeners();
        this.core.sourceHoldersTransformer.transformStageSourceHolders().withoutTimeout();
    }

    componentDidMount() {
        this.data.isMounted = true;
        if (this.props.isOpen) {
            this.initialize();
            this.core.closeOpenLightbox.addOpeningClassToDocument();
        }
    }

    componentWillUnmount() {
        this.core.lightboxUnmounter.callUnmountActions();
    }

    render() {
        if (!this.state.isOpen) return null;

        return (
            <div ref={ this.elements.container }
                 className="fslightbox-container fslightbox-full-dimension fslightbox-fade-in-long">
                <DownEventDetector fsLightbox={ this }/>
                <SwipingInvisibleHover fsLightbox={ this }/>
                <Nav fsLightbox={ this }/>
                { (this.data.totalSlides > 1) ?
                    <>
                        <SlideButtonLeft fsLightbox={ this }/>
                        <SlideButtonRight fsLightbox={ this }/>
                    </> : null
                }
                <SourcesHoldersWrapper fsLightbox={ this }/>
            </div>
        );
    }
}

FsLightbox.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    urls: PropTypes.array.isRequired,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    onInit: PropTypes.func,
    onShow: PropTypes.func,
    videosPosters: PropTypes.array,
    slide: PropTypes.number,
    slideDistance: PropTypes.number,
};

export default FsLightbox;