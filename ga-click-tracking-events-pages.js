/**
 * Google Analytics link and download click event and virtual pageview tracking
 * 20130419
 *
 * Use Google Analytics (GA) to track clicks on PDF and TXT files as
 * virtual pageviews.
 * GA will track clicks as events on the following link types:
 * External (Different host than current site or rel="external"),
 * file (MP3s, EXEs, ZIPs, etc.), email (mailto:) and telephone (tel:).
 *
 * For more information about Google Analytics link tracking, see:
 * https://support.google.com/analytics/answer/1136922
 *
 * Based on code from Blast Analytics & Marketing
 * "How to Track Downloads & Outbound Links in Google Analytics"
 * http://bit.ly/11K1Rcm
 *
 * Copyright 2013 Jeffrey Barke
 * Released under the MIT license
 * http://opensource.org/licenses/MIT
 */
/*jslint browser: true, nomen: true, white: true */
/*global _gaq, jQuery */

// Make sure there is a Google Analytics and a jQuery, otherwise not much point.
if (!(window._gaq === undefined || window.jQuery === undefined)) {
	// Wrap in anonymous function to safely alias jQuery.
	(function ($) {
		'use strict';
		// Document ready.
		$(function () {

			var eventTypes = '\\.(' +
					'dmg|exe|' +
					'rar|zip|' +
					'mp3|' +
					'avi|flv|mov|wav|wma|wmv|' +
					'docx?|xlsx?|pptx?' +
					')$',

				viewTypes = '\\.(' +
						'pdf|txt' +
						')$',

				regExes = {
					download: new RegExp(eventTypes, 'i'),
					email: /^mailto\:/i,
					external: /^https?\:\/\//i,
					hostName: new RegExp(location.host, 'i'),
					pageview: new RegExp(viewTypes, 'i'),
					phone: /^tel\:/i
				},

				baseHref = $('base').attr('href') || '',

				// Helper functions

				isDownload = function (url) {
					return regExes.download.test(url);
				},

				isEmail = function (url) {
					return regExes.email.test(url);
				},

				isExternal = function (url, rel) {
					// External links have either been marked rel=external
					// or must begin with https? 
					// and must not include current host name.
					return ((rel || '').indexOf('external') !== -1) ||
							(regExes.external.test(url) &&
							!regExes.hostName.test(url));
				},

				isPageview = function (url) {
					return regExes.pageview.test(url);
				},

				isPhone = function (url) {
					return regExes.phone.test(url);
				},

				getFileName = function (url) {
					var parts = url.split('/');
					return parts[parts.length - 1];
				},

				getFileExt = function (fileName) {
					var ext = (regExes.download.test(fileName)) ?
							fileName.match(regExes.download)[1] :
							fileName.match(regExes.pageview)[1];
					return ext.toUpperCase();
				},

				setData = function (loc, category, action, label) {
					loc = loc || '';
					category = category || 'Link clicks';
					action = action || '';
					label = label || '';
					return {
						category: category,
						action: action,
						label: label,
						loc: loc
					};
				};

			$('body').on('click', 'a', function () {
				var $el = $(this),
					url = $el.attr('href') || '',
					rel = $el.attr('rel') || '',
					target = ($el.attr('target') || '').toLowerCase(),
					fileName,
					action = 'event',
					data;
				// External link.
				if (isExternal(url, rel)) {
					data = setData(url, null, 'External link', url);
				// Download link.
				} else if (isDownload(url)) {
					fileName = getFileName(url);
					data = setData(baseHref + url, 'Downloads',
							getFileExt(fileName) + ' download', fileName);
				// Virtual pageview link.
				} else if (isPageview(url)) {
					action = 'pageview';
					fileName = getFileName(url);
					data = setData(baseHref + url,
							'/' + getFileExt(fileName) + '/' + fileName);
				// Email link.
				} else if (isEmail(url)) {
					data = setData(url, null, 'Email link',
							url.replace(regExes.email, ''));
				// Telephone link.
				} else if (isPhone(url)) {
					data = setData(url, null, 'Telephone link',
							url.replace(regExes.phone, ''));
				// Internal link. Don't track.
				} else {
					return;
				}
				// Track it.
				if (action === 'event') {
					_gaq.push(['_trackEvent', data.category, data.action,
							data.label]);
				} else if (action === 'pageview') {
					_gaq.push(['_trackPageview', data.category]);
				}
				// If link doesn't open in new window, give GA time to
				// track it.
				if ('_blank' !== target) {
					setTimeout(function () {
						location.href = data.loc;
					}, 400);
					return false;
				}
			});

		});
	}(jQuery));
}