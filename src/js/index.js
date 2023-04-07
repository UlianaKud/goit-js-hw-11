import { PixabayAPI } from './pixabay-api';
import { renderImagesList } from './renderImageList';

import Notiflix from 'notiflix';
import 'simplelightbox/dist/simple-lightbox.min.css';
import SimpleLightbox from 'simplelightbox';

const searchFormEl = document.querySelector('.search-form');
const galleryList = document.querySelector('.gallery');
const spinnerContainer = document.querySelector('.spinner');

const pixabayApi = new PixabayAPI();
let gallery;
let isLoading = false;

const showSpinner = () => {
  spinnerContainer.classList.remove('is-spinner-hidden');
}

const hideSpinner = () => {
  spinnerContainer.classList.add('is-spinner-hidden');
}

const shouldLoadMore = () => {
  const { height } = galleryList.getBoundingClientRect();

  if (height - window.pageYOffset < 1000 && !isLoading) {
    return true;
  }

  return false;
};

document.addEventListener('scroll', () => {
  if (shouldLoadMore()) {
    onLoadMore();
  }
});

const onSearchFormSubmit = async event => {
  event.preventDefault();
  pixabayApi.page = 1;

  const searchQuery = event.currentTarget.elements['searchQuery'].value;
  pixabayApi.q = searchQuery;
  if (!searchQuery?.trim()) {
    galleryList.innerHTML = '';
    Notiflix.Notify.failure('Oops, request is empty');
    return;
  }

  try {
    galleryList.innerHTML = '';
    showSpinner();
    const { data } = await pixabayApi.fetchPhotos();
    if (!data.hits?.length) {
      hideSpinner();
      galleryList.innerHTML = '';
      Notiflix.Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
      return;
    }

    pixabayApi.totalHits = data.totalHits;
    hideSpinner();
    galleryList.innerHTML = renderImagesList(data.hits);
    gallery = new SimpleLightbox('.gallery a');

    Notiflix.Notify.success(`"Hooray! We found ${data.totalHits} images.`);
  } catch (err) {
    console.log(err);
  }
};

const onLoadMore = async () => {
  pixabayApi.page += 1;

  try {
    if ((pixabayApi.page - 1) * pixabayApi.per_page > pixabayApi.totalHits) {
      return;
    }
    isLoading = true;
    showSpinner();
    const { data } = await pixabayApi.fetchPhotos();
    hideSpinner();
    galleryList.insertAdjacentHTML('beforeend', renderImagesList(data.hits));
    isLoading = false;
    if (shouldLoadMore()) {
      onLoadMore();
    }
    gallery.refresh();
    const { height } = document
      .querySelector('.gallery')
      .firstElementChild.getBoundingClientRect();
    window.scrollBy({
      top: height * 2,
      behavior: 'smooth',
    });
  } catch (err) {
    isLoading = false;
    console.log(err);
  }
};

searchFormEl.addEventListener('submit', onSearchFormSubmit);
